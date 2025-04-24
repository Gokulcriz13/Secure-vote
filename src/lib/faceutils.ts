export async function verifyFace(
  aadhaar: string,
  voterId: string,
  descriptor: Float32Array
): Promise<{ isMatch: boolean; message: string }> {
  try {
    const response = await fetch('/api/face-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aadhaar,
        voterId,
        faceDescriptor: Array.from(descriptor),
        mode: 'verify',
      }),
    });

    const rawText = await response.text();

    try {
      // Check for unexpected characters
      const trimmed = rawText.trim();
      const jsonStart = trimmed.indexOf('{');
      const jsonEnd = trimmed.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Response is not valid JSON object');
      }

      const jsonString = trimmed.substring(jsonStart, jsonEnd + 1);
      const result = JSON.parse(jsonString);

      if (!result.success) {
        return {
          isMatch: false,
          message: result.message || 'Face verification failed',
        };
      }

      return {
        isMatch: result.match,
        message: result.message,
      };
    } catch (jsonErr) {
      console.error('JSON parse error:', rawText);
      return {
        isMatch: false,
        message: 'Invalid response format from server.',
      };
    }
  } catch (err) {
    console.error('Face verification fetch error:', err);
    return {
      isMatch: false,
      message: 'Network error or server is unreachable.',
    };
  }
}
