import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let model = null;
let isLoading = false;

export async function loadModel() {
  if (model) return model;
  
  if (isLoading) {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (model) {
          clearInterval(check);
          resolve(model);
        }
      }, 500);
    });
  }

  try {
    isLoading = true;
    console.log('Đang tải mô hình AI cục bộ (COCO-SSD)...');
    // Đảm bảo backend được khởi tạo
    await tf.ready();
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    console.log('Đã tải xong mô hình COCO-SSD');
    return model;
  } catch (error) {
    console.error('Lỗi khi tải COCO-SSD:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

export async function detectFromImageElement(imgElement) {
  try {
    const loadedModel = await loadModel();
    const predictions = await loadedModel.detect(imgElement);
    // Trả về danh sách nhãn có độ tin cậy > 50%
    return predictions
      .filter(p => p.score > 0.5)
      .map(p => p.class);
  } catch (error) {
    console.error('Lỗi nhận diện bằng COCO-SSD:', error);
    return [];
  }
}
