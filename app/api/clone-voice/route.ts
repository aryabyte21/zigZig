import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const audioFiles: File[] = [];
    
    // Collect all audio files
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`audio_${i}`) as File;
      if (file) {
        audioFiles.push(file);
      }
    }

    if (audioFiles.length < 3) {
      return NextResponse.json({ 
        error: "All 3 voice samples are required" 
      }, { status: 400 });
    }

    // Upload audio files to Supabase storage
    const audioUrls: string[] = [];
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const fileName = `${user.id}/voice_sample_${i}_${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from("audio-samples")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading audio file:", uploadError);
        return NextResponse.json({ 
          error: "Failed to upload audio files" 
        }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("audio-samples")
        .getPublicUrl(fileName);
      
      audioUrls.push(publicUrl);
    }

    // Save audio files to temporary directory for ElevenLabs MCP
    const tempFiles: string[] = [];
    let voiceId: string;
    
    try {
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempPath = join(tmpdir(), `voice_sample_${user.id}_${i}_${Date.now()}.webm`);
        await writeFile(tempPath, buffer);
        tempFiles.push(tempPath);
      }

      // Clone voice using ElevenLabs API
      console.log("Cloning voice with ElevenLabs...");
      console.log("Name:", `${name}'s Voice`);
      
      const formData = new FormData();
      formData.append('name', `${name}'s Voice`);
      formData.append('description', `AI voice clone for ${name}'s portfolio assistant`);
      
      // Add audio files to form data
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        formData.append('files', file);
      }
      
      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voice cloning failed: ${error}`);
      }
      
      const voiceResult = await response.json();
      voiceId = voiceResult.voice_id;
      
      console.log("Voice cloned successfully:", voiceId);

    } finally {
      // Clean up temporary files
      for (const tempFile of tempFiles) {
        try {
          await unlink(tempFile);
        } catch (err) {
          console.error("Error deleting temp file:", err);
        }
      }
    }

    // Store voice ID in user profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        ai_voice_id: voiceId,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return NextResponse.json({ 
        error: "Failed to save voice ID" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      voiceId,
      message: "Voice cloned successfully" 
    });

  } catch (error) {
    console.error("Voice cloning error:", error);
    return NextResponse.json({ 
      error: "Failed to clone voice" 
    }, { status: 500 });
  }
}

