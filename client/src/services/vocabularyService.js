import vocabularyData from '../data/vocabulary.json';

export function lookupStatic(labels) {
  if (!Array.isArray(labels)) return [];
  
  return labels.map(label => {
    const key = String(label).trim().toLowerCase();
    const data = vocabularyData[key];
    
    if (data) {
      return {
        english: label,
        ipa: data.ipa || '',
        vietnamese: data.vietnamese || '',
        type: data.type || '',
        example: data.example || '',
        category: data.category || 'General'
      };
    }
    
    return {
      english: label,
      ipa: '',
      vietnamese: '',
      type: '',
      example: '',
      category: 'General'
    };
  });
}

export async function getVocabulary(words) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${apiUrl}/api/vocabulary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ words })
    });
    
    if (!response.ok) {
      throw new Error('API failed');
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API getVocabulary failed, falling back to static', error);
    return lookupStatic(words);
  }
}
