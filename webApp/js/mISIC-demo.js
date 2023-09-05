'use strict';

import { addShim, createRectangle } from './viewerController.js';


function mouseMoveHandler(event) {
  const viewer = event.eventSource;
  const overlay = viewer.currentOverlays[0];
  const webPoint = event.position;
  const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
  const hitInfo = overlay.hitTest(viewportPoint);

  if (hitInfo) {
    // Display hitInfo.element.title as tooltip
    showTooltip(webPoint, hitInfo.element.title);
  } else {
    hideTooltip();
  }
}

function transformCoordinates(coord) {
  return [coord[0] / 100000, (100000 - coord[1]) / 100000];
}


function formatForD3(inputData, scaling = 1) {
  function parseCoord(coordStr) {
    return coordStr.slice(1, -1).split(', ').map(Number);
  }

  return [
    { x: parseCoord(inputData.Coord1)[0] / scaling, y: parseCoord(inputData.Coord1)[1] / scaling },
    { x: parseCoord(inputData.Coord2)[0] / scaling, y: parseCoord(inputData.Coord2)[1] / scaling },
    { x: parseCoord(inputData.Coord3)[0] / scaling, y: parseCoord(inputData.Coord3)[1] / scaling },
    { x: parseCoord(inputData.Coord4)[0] / scaling, y: parseCoord(inputData.Coord4)[1] / scaling }
  ];
}


function addOverlay(rcmDataList, overlay) {
  $.each(rcmDataList, function (index, rcmView) {
    //var fillColor = d3.schemeCategory20[index % 20];
    // console.log(index, tile, fillColor);
    console.log(rcmView)
    //Determine the color based on the ImageType
    var fillColor = 'green';

    if (rcmView.ImageType == 'confocal image') {
      fillColor = 'blue'
    }
    var rcmBoundaryPoints = formatForD3(rcmView, 100000);

    let pointsString = rcmBoundaryPoints.map(point => `${point.x},${point.y}`).join(' ');

    var node = d3
      .select(overlay.node())
      .append('polygon')
      .attr('fill', 'none')
      .attr('points', pointsString)
      .style('fill', 'none')
      .attr('class', 'boundaryClass')
      .attr('stroke', fillColor)
      .attr('stroke-width', 0.005)
      .attr('opacity', 0.25);
    //      .attr('id', 'boundaryLI' + tile.properties.labelindex)
    //   .on('mouseover', handleMouseOver);

    //self.deselectCell(node);
  });
}


function parseCSV(url, callback) {
  console.log(url)
  fetch(url)
    .then(response => response.text())
    .then(text => {
      Papa.parse(text, {
        complete: function (result) {

          let data = result.data.filter(row => row && Object.keys(row).length > 0 && row["UID"] != null);
          callback(data);
        },
        header: true,
      });
    })
    .catch(error => console.error('Error fetching CSV file:', error));
}




function drawRectangles(data, overlay) {
  console.log(data)
  data.forEach((item, index) => {
    // if (index === 0) return; // Skip the header row

    let coord1 = transformCoordinates(JSON.parse(item.Coord1));
    let coord2 = transformCoordinates(JSON.parse(item.Coord2));
    let coord3 = transformCoordinates(JSON.parse(item.Coord3));
    let coord4 = transformCoordinates(JSON.parse(item.Coord4));


    const coordinates = [
      coord1, coord2, coord3, coord4];
    //console.log(coordinates)
    const color = getColorBasedOnRow(index); // A function to get color based on row index or any other criteria

    createCSVRectangle(overlay, coordinates, color);
  });
}


function createCSVRectangle(overlay, coordinates, color, description) {
  // Coordinates are in the format [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
  const [x, y] = coordinates[0];
  const [width, height] = [Math.abs(coordinates[0][0] - coordinates[1][0]), Math.abs(coordinates[0][1] - coordinates[2][1])];

  DSA.createSVGElement('rect', overlay.node(), {
    x: x,
    y: y,
    width: width,
    height: height,
    stroke: color,
    fill: 'none',
    'stroke-width': 0.005,
    'pointer-events': 'all',
    title: description
  });
}

function showTooltip(point, text) {
  const tooltip = document.getElementById('tooltip');
  tooltip.style.left = point.x + 'px';
  tooltip.style.top = point.y + 'px';
  tooltip.textContent = text;
  tooltip.style.display = 'block';
}

function hideTooltip() {
  const tooltip = document.getElementById('tooltip');
  tooltip.style.display = 'none';
}



function getColorBasedOnRow(index) {
  // Define your logic to return different colors based on the row index or any other criteria
  return index % 2 === 0 ? 'red' : 'blue';
}


(function () {
  // ----------
  window.App = _.extend(window.App || {}, {
    // ----------
    init: async function () {
      var self = this;

      this.$layerSlider = $('.layer-slider');
      this.$layerName = $('.layer-name');
      this.$layers = $('.layers');
      this.viewerStateIndex = -1;

      try {
        this.viewerStates = await Promise.all([
          this.makeViewerState('VivaStack #1'),
          // this.makeViewerState('VivaStack #3')
        ]);
      } catch (error) {
        console.error('Error initializing viewer states:', error);
        return;
      }

      // The rest of your init function here
      this.overview = OpenSeadragon({
        element: document.querySelector('.overview-container'),
        tileSources: 'https://wsi-deid.pathology.emory.edu/api/v1/item/64e7679f309a9ffde668bd4a/tiles/dzi.dzi',
        prefixUrl: '/lib/openseadragon/images/',
        maxZoomPixelRatio: 6,
        crossOriginPolicy: 'Anonymous',
        zoomPerClick: 1,
        //width: 100000
      });

      var overlay = this.overview.svgOverlay();


      var rect3 = createRectangle(overlay, 0.22, 0.26, 0.15, 0.10, 'orange', function () {
        self.startViewer(0);
      });

      // function addOverlay(rcmObjects) {
      //   $.each(rcmObjects, function (index, tile) {
      //     var fillColor = d3.schemeCategory20[index % 20];
      //     // console.log(index, tile, fillColor);
      //     console.log(tile)
      //     // var node = d3
      //     //   .select(overlay.node())
      //     //   .append('polygon')
      //     //   .style('fill', fillColor)
      //     //   .attr('points', tile.geometry.coordinates.join(' '))
      //     //   .attr('class', 'boundaryClass')
      //     //   .attr('id', 'boundaryLI' + tile.properties.labelindex)
      //     //   .on('mouseover', handleMouseOver);

      //     // self.deselectCell(node);
      //   });
      // }


      parseCSV('/js/regExampleData.csv', function (data) {
        // Draw rectangles on the overlay image using the parsed data
        //drawRectangles(data, overlay);
        addOverlay(data, overlay);
      });


      this.$layerSlider.on('input', function () {
        self.updateLayer();
      });

      this.startViewer(0);
    },

    // ----------
    makeViewerState: async function (key) {
      try {
        if (key === 'VivaStack #1') {

          var dsaBaseURL = 'https://wsi-deid.pathology.emory.edu/api/v1/'
          var curItemGirderId = '64e7bc63309a9ffde668c3cf'

          const response = await fetch(dsaBaseURL + `/item/${curItemGirderId}/tiles`);
          const data = await response.json();

          console.log(data)
          var tileSources = data.frames.map(frame => {
            return {
              type: 'image',
              getTileUrl: function (level, x, y) {
                return (
                  `${dsaBaseURL}/item/${curItemGirderId}/tiles/fzxy/${frame.Index}/` +
                  level + '/' + x + '/' + y + '?edge=crop'
                );
              },
              width: data.sizeX,
              height: data.sizeY,
              tileSize: data.tileWidth,
              maxLevel: data.levels - 1
            };
          });

          var layers = tileSources.map(tileSource => {
            return DSA.makeLayer({ tileSource: tileSource });
          });

          return {
            layers: layers,
            layerIndex: layers.length - 1
          };
        } else {
          // Handling for 'VivaStack #3'
          var tileSources = App.mISIC_RCM[key];
          var layers = _.map(tileSources, function (tileSource) {
            return DSA.makeLayer({ tileSource: tileSource });
          });

          return {
            layers: layers,
            layerIndex: layers.length - 1
          };
        }
      } catch (error) {
        console.error('Error fetching data for:', key, error);
        throw error;
      }
    },

    startViewer: function (index) {
      var self = this;
      if (index === this.viewerStateIndex) {
        return;
      }

      var state = this.viewerStates[index];
      if (!state) {
        console.error('bad index', index);
        return;
      }

      this.viewerStateIndex = index;
      this.viewerState = state;

      if (this.viewer) {
        this.viewer.destroy();
      }

      this.viewer = new DSA.OverlaidViewer({
        container: document.querySelector('.viewer-container'),
        state: state,
        options: {
          prefixUrl: '/lib/openseadragon/images/',
          maxZoomPixelRatio: 5
        },
        onOpen: function () {
          self.updateLayer();
        }
      });
      // Add this somewhere in your initialization code
      //this.viewer.addHandler('mousemove', mouseMoveHandler);



      this.$layerSlider.attr({
        min: 0,
        max: this.viewerState.layers.length - 1
      });

      this.$layerSlider.val(this.viewerState.layers.length - 1 - this.viewerState.layerIndex);
    },

    updateLayer: function () {
      var self = this;

      var index = this.viewerState.layers.length - 1 - parseInt(this.$layerSlider.val(), 10);
      var i, visible;
      for (i = 0; i < this.viewerState.layers.length; i++) {
        visible = i === index || i === index - 1;
        this.viewerState.layers[i].opacity = visible ? 1 : 0;
      }

      this.update();

      this.viewerState.layerIndex = index;

      var tileSource = this.viewerState.layers[index].tileSource;
      this.$layerName.text(tileSource.imageName);

      this.$layers.empty();

      this.addSlider({
        container: this.$layers,
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        value: this.viewerState.layers[index].opacity,
        onChange: function (value) {
          self.viewerState.layers[index].opacity = value;
          self.update();
        }
      });

      this.addSlider({
        container: this.$layers,
        label: 'Colorize',
        min: 0,
        max: 1,
        step: 0.01,
        value: this.viewerState.layers[index].colorize,
        onChange: function (value) {
          self.viewerState.layers[index].colorize = value;
          self.update();
        }
      });



      this.addSlider({
        container: this.$layers,
        label: 'Hue',
        min: 0,
        max: 360,
        step: 1,
        value: this.viewerState.layers[index].hue,
        onChange: function (value) {
          self.viewerState.layers[index].hue = value;
          self.update();
        }
      });
      addShim(index, this.viewer, '.layers');
    },




    update: function () {
      this.viewer.setState(this.viewerState);
    }
  });

  // ----------
  setTimeout(function () {
    App.init();
  }, 1);
})();


 // this.addSlider({
      //   container: this.$layers,
      //   label: 'imgProcess',
      //   min: 1,
      //   max: 9,
      //   step: 2,
      //   value: this.viewerState.layers[index].imgProcess,
      //   onChange: function (value) {
      //     self.viewerState.layers[index].imgProcess = value;
      //     self.update();
      //   }
      // });

       // addCheckbox: function (index) {
    //   var self = this;
    //   var layers = document.querySelector('.layers');

    //   var div = document.createElement('div');
    //   layers.appendChild(div);

    //   var label = document.createElement('label');
    //   div.appendChild(label);

    //   var checkbox = document.createElement('input');
    //   checkbox.type = 'checkbox';
    //   checkbox.checked = true;
    //   label.appendChild(checkbox);

    //   var labelText = document.createTextNode(' Layer ' + (index + 1));
    //   label.appendChild(labelText);

    //   label.addEventListener('click', function () {
    //     self.viewerState.layers[index].shown = !!checkbox.checked;
    //     self.update();
    //   });
    // },