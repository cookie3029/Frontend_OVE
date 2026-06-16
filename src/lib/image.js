// 업로드한 사진을 캔버스로 축소해 JPEG 데이터 URL 로 변환합니다.
// localStorage 용량(브라우저당 보통 약 5MB)을 넘지 않도록 최대 변과 품질을 제한합니다.

export function fileToCompressedDataURL(file, { maxSize = 1280, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('선택된 파일이 없어요.'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드할 수 있어요. (jpg, png, webp 등)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요. 다시 시도해 주세요.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 불러오지 못했어요. 다른 파일을 사용해 주세요.'));
      img.onload = () => {
        let { width, height } = img;

        // 긴 변을 maxSize 에 맞춰 비율을 유지하며 축소
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('이미지를 처리하지 못했어요.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
