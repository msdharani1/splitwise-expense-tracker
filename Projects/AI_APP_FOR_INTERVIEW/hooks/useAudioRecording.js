import { useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export const useAudioRecording = (onTranscriptionComplete) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await transcribeAudio(base64);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const transcribeAudio = async (base64Data) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: `data:audio/m4a;base64,${base64Data}`,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      formData.append('model', 'distil-whisper-large-v3-en');
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer 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`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription API error');
      const data = await response.json();
      onTranscriptionComplete(data.text || '');
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Error', `Transcription failed: ${error.message}`);
    }
  };

  return { isRecording, startRecording, stopRecording };
};

export default useAudioRecording;