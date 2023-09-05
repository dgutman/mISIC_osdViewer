export function addShim(index, viewer, layersContainer) {
    var pixelWidth = viewer.getLayerPixelWidth(index);
    var pixelHeight = viewer.getLayerPixelWidth(index);
    var offset = viewer.getLayerPixelOffset(index);

    var layers = document.querySelector(layersContainer);

    var div = document.createElement('div');
    layers.appendChild(div);

    var shimText = document.createTextNode(' Shim X: ');
    div.appendChild(shimText);


    var xSlider = document.createElement('input');
    xSlider.type = 'range';
    xSlider.min = -pixelWidth;
    xSlider.max = pixelWidth;
    xSlider.step = 1;
    xSlider.value = offset.x;
    div.appendChild(xSlider);

    var xLabel = document.createTextNode(' ' + xSlider.value);
    div.appendChild(xLabel);

    div = document.createElement('div');
    layers.appendChild(div);

    shimText = document.createTextNode(' Shim Y: ');
    div.appendChild(shimText);

    var ySlider = document.createElement('input');
    ySlider.type = 'range';
    ySlider.min = -pixelHeight;
    ySlider.max = pixelHeight;
    ySlider.step = 1;
    ySlider.value = offset.y;
    div.appendChild(ySlider);

    var yLabel = document.createTextNode(' ' + ySlider.value);
    div.appendChild(yLabel);

    var update = function () {
        viewer.setLayerPixelOffset(index, xSlider.value, ySlider.value);
        xLabel.textContent = ' ' + xSlider.value;
        yLabel.textContent = ' ' + ySlider.value;
    };

    xSlider.addEventListener('input', update);
    ySlider.addEventListener('input', update);
}



export function createRectangle(overlay, x, y, width, height, color, callback) {
    var rect = DSA.createSVGElement('rect', overlay.node(), {
        x: x,
        y: y,
        width: width,
        height: height,
        stroke: color,
        fill: 'none',
        'stroke-width': 0.005,
        'pointer-events': 'all'
    });

    rect.addEventListener('click', callback);

    return rect;
}