'use strict';

import { addShim } from './viewerController.js';


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
        zoomPerClick: 1
      });

      var overlay = this.overview.svgOverlay();

      var rect1 = DSA.createSVGElement('rect', overlay.node(), {
        x: 0.31,
        y: 0.16,
        width: 0.15,
        height: 0.15,
        stroke: 'red',
        fill: 'none',
        'stroke-width': 0.005,
        'pointer-events': 'all'
      });

      rect1.addEventListener('click', function () {
        self.startViewer(0);
      });

      var rect2 = DSA.createSVGElement('rect', overlay.node(), {
        x: 0.62,
        y: 0.46,
        width: 0.15,
        height: 0.15,
        stroke: 'blue',
        fill: 'none',
        'stroke-width': 0.005,
        'pointer-events': 'all'
      });

      rect2.addEventListener('click', function () {
        self.startViewer(1);
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

    // The rest of your methods here, unchanged
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
        label: 'imgProcess',
        min: 1,
        max: 9,
        step: 2,
        value: this.viewerState.layers[index].imgProcess,
        onChange: function (value) {
          self.viewerState.layers[index].imgProcess = value;
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

    addCheckbox: function (index) {
      var self = this;
      var layers = document.querySelector('.layers');

      var div = document.createElement('div');
      layers.appendChild(div);

      var label = document.createElement('label');
      div.appendChild(label);

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      label.appendChild(checkbox);

      var labelText = document.createTextNode(' Layer ' + (index + 1));
      label.appendChild(labelText);

      label.addEventListener('click', function () {
        self.viewerState.layers[index].shown = !!checkbox.checked;
        self.update();
      });
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
