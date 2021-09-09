// @ts-nocheck
// TODO: Add proper TypeScript for this page object
// For now, we just want a compiled .js file to appear in `dist`

module.exports = {
  url: "http://localhost:8080",
  commands: [{
    waitForReady: function () {
      return this
        .waitForElementVisible("@app")
        .waitForElementVisible("@wwtComponent");
    },
  }],
  props: {
    title: "AAS WorldWide Telescope"
  },
  elements: {
    app: {
      selector: "#app"
    },
    wwtComponent: {
      selector: ".wwt"
    },
    displayPanel: {
      selector: "#display-panel"
    },
    controls: {
      selector: "#controls"
    },
    tools: {
      selector: "#tools"
    },
    toolMenu: {
      selector: ".tool-menu"
    },
    backgroundButton: {
      selector: ".tool-menu > li > a > .fa-mountain"
    },
    catalogButton: {
      selector: ".tool-menu > li > a > .fa-map-marked-alt"
    }
  },

  sections: {
    displayPanel: {
      selector: "#display-panel",
      elements: {
        coordinateDisplay: {
          selector: "#overlays > p"
        },
        layersContainer: {
          selector: "#layers-container"
        },
        layersHeader: {
          selector: "#layers-container .display-section-header"
        },
        sourcesContainer: {
          selector: "#sources-container"
        },
        sourcesHeader: {
          selector: "#sources-container .display-section-header"
        },
        // We need to specify the layer container id
        // in case other Vue components use the inner selectors
        // i.e., the source components have a similar structure
        // with some of the same IDs
        layerItem: {
          selector: "#layers-container #root-container"
        },
        layerMainContainer: {
          selector: "#layers-container #main-container"
        },
        layerTitle: {
          selector: "#layers-container #name-label"
        },
        layerButtonContainer: {
          selector: "#layers-container #buttons-container"
        },
        layerVisibilityButton: {
          selector: "#layers-container #buttons-container .fa-eye, #layers-container #buttons-container .fa-eye-slash"
        },
        layerDeleteButton: {
          selector: "#layers-container #buttons-container .fa-times"
        },
      },
      props: {
        initialCoordinateText: "17:45:35 -28:53:59",
        detailClass: ".detail-container",
      },
    },
    controls: {
      selector: "#controls",
      elements: {
        controlItem: {
          selector: "li"
        },
        toolChooser: {
          selector: "li .v-popover .fa-sliders-h"
        },
        zoomIn: {
          selector: "li .fa-search-plus"
        },
        zoomOut: {
          selector: "li .fa-search-minus"
        },
        fullScreen: {
          selector: "li .fa-expand"
        }
      },
      props: {
        controlItemCount: 4
      },
    },
    tools: {
      selector: "#tools",
      elements: {
        backgroundSelectionContainer: {
          selector: "#bg-select-container"
        },
        backgroundSelectionTitle: {
          selector: "#bg-select-title"
        },
        selectedBackgroundText: {
          selector: ".vs__selected div"
        },
        backgroundSelectionToggle: {
          selector: ".vs__dropdown-toggle"
        },
        backgroundDropdown: {
          selector: ".vs__dropdown-menu"
        },
        backgroundDropdownOption: {
          selector: ".vs__dropdown-option"
        },
        backgroundDropdownOptionName: {
          selector: ".vs__dropdown-option > div > h4"
        },
        backgroundDropdownOptionDescription: {
        selector: ".vs__dropdown-option > div > em"
        },
        catalogSelectionContainer: {
          selector: "#catalog-select-container-tool"
        },
        catalogSelectionTitle: {
          selector: "#catalog-select-container-tool .item-select-title"
        },
        catalogSelectionToggle: {
          selector: ".vs__dropdown-toggle"
        },
        catalogDropdown: {
          selector: ".vs__dropdown-menu"
        },
        catalogDropdownOption: {
          selector: ".vs__dropdown-option"
        },
        catalogDropdownOptionName: {
          selector: ".vs__dropdown-option > div > h4"
        },
        catalogDropdownOptionDescription: {
        selector: ".vs__dropdown-option > div > em"
        },
      },
      props: {
        backgroundOptionCount: 832,
        catalogOptionCount: 49,
        firstBackgroundName: "Digitized Sky Survey (Color)",
        firstBackgroundDescription: "Copyright DSS Consortium",
        firstCatalogName: "The DENIS database (DENIS Consortium, 2005) (denis)",
      },
    }
  }
}
