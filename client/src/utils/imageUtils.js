export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function resizeImage(file, maxWidth = 1024, maxHeight = 1024) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Calculate scaling ratio
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(blob => resolve(blob), file.type, 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}
