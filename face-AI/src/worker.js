self.onmessage = function(e) {
    const { frame, width, height } = e.data;

    // Chuyển đổi base64 sang ảnh
    const img = new Image();
    img.src = frame;

    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d');

    img.onload = () => {
        // Xóa canvas trước khi vẽ lại
        ctx.clearRect(0, 0, width, height);
        // Vẽ ảnh vào OffscreenCanvas
        ctx.drawImage(img, 0, 0, width, height);

        // Chuyển ảnh canvas thành base64 và gửi lại về luồng chính
        const base64Image = offscreen.convertToBlob().then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
                self.postMessage({ base64Image: reader.result });
            };
            reader.readAsDataURL(blob);
        });
    }
}