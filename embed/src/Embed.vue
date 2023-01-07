<template>
  <v-app id="app">
    <WorldWideTelescope
      wwt-namespace="wwt-embed"
      v-bind:style="{
        height: wwtComponentLayout.height,
        top: wwtComponentLayout.top,
      }"
    ></WorldWideTelescope>

    <transition name="fade">
      <div class="modal" id="modal-loading" v-show="isLoadingState || hubbleLayer == null">
        <div class="container">
          <div class="spinner"></div>
          <p>Loading …</p>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div
        class="modal"
        id="modal-readytostart"
        v-show="isReadyToStartState"
        @click="startInteractive()"
      >
        <div>
          <font-awesome-icon class="icon" icon="play"></font-awesome-icon>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div id="overlays">
        <p v-show="embedSettings.showCoordinateReadout">{{ coordText }}</p>
      </div>
    </transition>

    <div id="video-icon-wrapper" class="control-icon-wrapper">
      <font-awesome-icon
        id="video-icon"
        class="control-icon"
        icon="video"
        size="lg"
        @click="selectBottomSheet('video')"
      ></font-awesome-icon>
    </div>
    <div id="text-icon-wrapper" class="control-icon-wrapper">
      <font-awesome-icon
        id="text-icon"
        class="control-icon"
        icon="book-open"
        size="lg"
        @click="selectBottomSheet('text')"
      ></font-awesome-icon>
    </div>

    <div id="bottom-content">
      <div id="tools">
        <div class="tool-container">
          <template v-if="currentTool == 'crossfade'">
            <span class="ui-text slider-label">Hubble</span>
            <input
              class="opacity-range"
              type="range"
              v-model="crossfadeOpacity"
            />
            <span class="ui-text slider-label">JWST</span>
          </template>
          <template v-else-if="currentTool == 'choose-background'">
            <span>Background imagery:</span>
            <select v-model="curBackgroundImagesetName">
              <option
                v-for="bg in backgroundImagesets"
                v-bind:value="bg.imagesetName"
                v-bind:key="bg.imagesetName"
              >
                {{ bg.displayName }}
              </option>
            </select>
          </template>
          <template v-else-if="currentTool == 'playback-controls'">
            <div class="playback-controls">
              <font-awesome-icon
                v-bind:icon="tourPlaybackIcon"
                size="lg"
                class="clickable"
                @click="tourPlaybackButtonClicked()"
              ></font-awesome-icon>
              <vue-slider
                class="scrubber"
                v-model="twoWayTourTimecode"
                :max="wwtTourRunTime"
                :marks="wwtTourStopStartTimes"
                :tooltip-formatter="formatTimecode"
                :adsorb="true"
                :duration="0"
                :interval="0.001"
                :contained="true"
                :hide-label="true"
                :use-keyboard="false"
              ></vue-slider>
            </div>
          </template>
        </div>
      </div>

      <div id="credits" class="ui-text" v-show="embedSettings.creditMode == CreditMode.Default">
        <div>
          Powered by
          <a href="https://worldwidetelescope.org/home/"
            >AAS WorldWide Telescope</a
          >
        </div>
        <div id="icons-container">
          <a href="https://worldwidetelescope.org/home/"
            ><img alt="CosmicDS Logo" src="./assets/logo_cosmicds.jpg"
          /></a>
          <a href="https://worldwidetelescope.org/home/"
            ><img alt="WWT Logo" src="./assets/logo_wwt.png"
          /></a>
          <a href="https://aas.org/"
            ><img alt="AAS Logo" src="./assets/logo_aas.png"
          /></a>
          <ShareNetwork
            v-for="network in networks"
            :key="network.name"
            :network="network.name"
            :class="`${network.name}-button`"
            :style="{ backgroundColor: network.color, width: 'fit-content' }"
            :description="description"
            :url="url"
            :title="title"
            :hashtags="hashtagString"
            :quote="description"
            twitter-user="WWTelescope"
          >
            <font-awesome-icon
              :class="`${network.name}-icon`"
              :icon="['fab', network.name]"
              size="lg"
            ></font-awesome-icon>
          </ShareNetwork>
        </div>
      </div>
    </div>

    <!-- <v-bottom-sheet
      id="video-bottom-sheet"
      hide-overlay
      persistent
      v-model="showVideoSheet"
    >
      <video controls>
        <source src="./assets/JWST-context.mp4" type="video/mp4">
      </video>
    </v-bottom-sheet> -->

    <v-dialog
      id="video-dialog"
      fullscreen
      v-model="showVideoSheet"
      transition="slide-y-transition"
    >
      <div class="video-wrapper">
        <font-awesome-icon
          class="close-icon"
          icon="times"
          size="lg"
          @click="showVideoSheet = false"
        ></font-awesome-icon>
        <video controls>
          <source src="./assets/JWST-context.mp4" type="video/mp4">
        </video>
      </div>
    </v-dialog>

    <v-bottom-sheet
      id="text-bottom-sheet"  
      hide-overlay
      persistent
      v-model="showTextSheet"
    >
      <v-card>
      <!-- <v-container height="11px">
        <font-awesome-icon
          class="close-icon"
          icon="times"
          @click="showTextSheet = false"
        ></font-awesome-icon>
      </v-container> -->
      <v-tabs
        v-model="tab"
        height="32px"
        dense
        grow
      >
        <v-tabs-slider color="white"></v-tabs-slider>

        <v-tab>Information</v-tab>
        <v-tab>Using WWT</v-tab>
      </v-tabs>

        <v-tabs-items v-model="tab" id="mobile-tabs" class="pb-2 no-bottom-border-radius">
          <v-tab-item class="scrollable">
            <v-card class="no-bottom-border-radius">
              <v-card-text class="info-text no-bottom-border-radius">
                What looks much like craggy mountains on a moonlit evening is actually the edge of a nearby, young, star-forming region NGC 3324 in the Carina Nebula. Captured in infrared light by the Near-Infrared Camera (NIRCam) on NASA’s James Webb Space Telescope, this image reveals previously obscured areas of star birth.
                <br>Called the Cosmic Cliffs, the region is actually the edge of a gigantic, gaseous cavity within NGC 3324, roughly 7,600 light-years away. The cavernous area has been carved from the nebula by the intense ultraviolet radiation and stellar winds from extremely massive, hot, young stars located in the center of the bubble, above the area shown in this image. The high-energy radiation from these stars is sculpting the nebula’s wall by slowly eroding it away.  
                NIRCam – with its crisp resolution and unparalleled sensitivity – unveils hundreds of previously hidden stars, and even numerous background galaxies. Several prominent features in this image are described below.
                <br>•	The “steam” that appears to rise from the celestial “mountains” is actually hot, ionized gas and hot dust streaming away from the nebula due to intense, ultraviolet radiation. 
                <br>•	Dramatic pillars rise above the glowing wall of gas, resisting the blistering ultraviolet radiation from the young stars.
                <br>•	Bubbles and cavities are being blown by the intense radiation and stellar winds of newborn stars.
                <br>•	Protostellar jets and outflows, which appear in gold, shoot from dust-enshrouded, nascent stars.
                <br>•	A “blow-out” erupts at the top-center of the ridge, spewing gas and dust into the interstellar medium. 
                <br>•	An unusual “arch” appears, looking like a bent-over cylinder.
                <br>This period of very early star formation is difficult to capture because, for an individual star, it lasts only about 50,000 to 100,000 years – but Webb’s extreme sensitivity and exquisite spatial resolution have chronicled this rare event.
                Located roughly 7,600 light-years away, NGC 3324 was first catalogued by James Dunlop in 1826. Visible from the Southern Hemisphere, it is located at the northwest corner of the Carina Nebula (NGC 3372), which resides in the constellation Carina. The Carina Nebula is home to the Keyhole Nebula and the active, unstable supergiant star called Eta Carinae. 
                NIRCam was built by a team at the University of Arizona and Lockheed Martin’s Advanced Technology Center.
              </v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item class="scrollable">
            <v-card class="no-bottom-border-radius">
              <v-card-text class="info-text no-bottom-border-radius">
                <v-container>
            <v-row>
              <v-col cols="8">
                <div
                  style="min-height: 120px;"
                >
                  <p>
                    The frame below provides an <b>interactive view </b>of the night sky, using images from real observations.
                  </p>
                  <p>
                    The brighter band you see going diagonally across the frame (before you try the controls) is caused by stars and dust in our home galaxy, called the <b>Milky Way.</b>
                  </p>
                  <p>
                    You can explore this view and see what is in the night sky, as astronomers have been doing for centuries. <b>Pan</b> (click and drag) and <b>zoom</b> (scroll in and out) to see parts of the sky beyond this view.
                  </p>
                </div>
              </v-col>
              <v-col cols="4" lg="3">
                <v-row>
                  <v-col
                    cols="12"
                    lg="4"
                  >
                    <v-chip
                      label
                      outlined
                    >
                      Pan
                    </v-chip>
                  </v-col>
                  <v-row>
                    <v-col
                      cols="12"
                      lg="8"
                      class="pt-2"
                    >
                      <strong>click + drag</strong><br>
                      (or use <strong class="codeFont">I-J-K-L</strong> keys)
                    </v-col>
                  </v-row>
                </v-row>
                <v-row>
                  <v-col
                    cols="12"
                    lg="4"
                  >
                    <v-chip
                      label
                      outlined
                    >
                      Zoom
                    </v-chip>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col
                    cols="12"
                    lg="8"
                    class="pt-2"
                  >
                    <strong>scroll in and out</strong><br>
                    (or use <strong class="codeFont">Z-X</strong> keys)
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-container>                  
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
      </v-card>
    </v-bottom-sheet>
  </v-app>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";

import * as screenfull from "screenfull";

import { fmtDegLat, fmtDegLon, fmtHours } from "@wwtelescope/astro";
import { Folder, FolderUp, Place, Imageset, ImageSetLayer } from "@wwtelescope/engine";
import { ImageSetType } from "@wwtelescope/engine-types";
import {
  SetupForImagesetOptions,
  WWTAwareComponent,
} from "@wwtelescope/engine-vuex";
import { CreditMode, EmbedSettings } from "@wwtelescope/embed-common";
import { Meta } from "@sophosoft/vue-meta-decorator";
import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";

/** The overall state of the WWT embed component. */
enum ComponentState {
  /** Waiting for resources and/or content to load. Not yet ready to start. */
  LoadingResources,

  /** Resources have loaded. We can start when the user activates us. */
  ReadyToStart,

  /** The user has activated us. */
  Started,
}

type ToolType = "crossfade" | "choose-background" | "playback-controls" | null;
type BottomSheetType = "text" | "video" | null;

class BackgroundImageset {
  public imagesetName: string;
  public displayName: string;

  constructor(displayName: string, imagesetName: string) {
    this.displayName = displayName;
    this.imagesetName = imagesetName;
  }
}

const skyBackgroundImagesets: BackgroundImageset[] = [
  new BackgroundImageset(
    "Optical (Terapixel DSS)",
    "Digitized Sky Survey (Color)"
  ),
  new BackgroundImageset(
    "Low-frequency radio (VLSS)",
    "VLSS: VLA Low-frequency Sky Survey (Radio)"
  ),
  new BackgroundImageset("Infrared (2MASS)", "2Mass: Imagery (Infrared)"),
  new BackgroundImageset("Infrared (SFD dust map)", "SFD Dust Map (Infrared)"),
  new BackgroundImageset("Ultraviolet (GALEX)", "GALEX (Ultraviolet)"),
  new BackgroundImageset(
    "X-Ray (ROSAT RASS)",
    "RASS: ROSAT All Sky Survey (X-ray)"
  ),
  new BackgroundImageset(
    "Gamma Rays (FERMI LAT 8-year)",
    "Fermi LAT 8-year (gamma)"
  ),
];

type Shape = { width: number; height: number };
const defaultWindowShape: Shape = { width: 1200, height: 900 };

type WwtComponentLayout = { top: string; height: string };

export type FolderItem = Folder | FolderUp | Imageset | Place;

@Component
export default class Embed extends WWTAwareComponent {
  CreditMode = CreditMode;

  @Prop({ default: new EmbedSettings() })
  readonly embedSettings!: EmbedSettings;
  @Prop({ default: "" }) jwstWtmlUrl!: string;
  @Prop({ default: "" }) url!: string;
  @Prop({ default: "" }) thumbnailUrl!: string;
  @Prop({ default: "" }) bgWtml!: string;
  @Prop({ default: "" }) bgName!: string;
  @Prop({ default: "" }) hubbleWtmlUrl!: string;

  componentState = ComponentState.LoadingResources;
  backgroundImagesets: BackgroundImageset[] = [];
  currentTool: ToolType = "crossfade";
  fullscreenModeActive = false;
  tourPlaybackJustEnded = false;
  windowShape = defaultWindowShape;

  collectionFolder: Folder | null = null;
  title = "Compare JWST and Hubble images of Carina";
  description = "Pan, zoom, and compare the images using AAS WorldWide Telescope.";
  hashtags = ["jwst", "hubble", "wwt", "carina", "unfoldtheuniverse"];

  bottomSheet: BottomSheetType = null;
  hubbleLayer: ImageSetLayer | null = null;
  
  cfOpacity: number = 50;
  tab: number = 0;

  get hashtagString() {
    return this.hashtags.join(",");
  }

  networks = [
    { name: "facebook", color: "#1877f2", text: "Share" },
    { name: "twitter", color: "#1da1f2", text: "Tweet" },
  ];

  // @Meta
  // getMetaInfo() {
  //   return {
  //     title: this.title,
  //     meta: [
  //       { property: "og:type", content: "website" },
  //       { property: "og:url", content: this.url },
  //       { property: "og:title", content: this.title },
  //       { property: "og:site_name", content: "WorldWide Telescope" },
  //       { property: "og:description", content: this.description },
  //       { property: "og:image", content: this.thumbnailUrl.replace("https", "http") },
  //       { property: "og:image:secure_url", content: this.thumbnailUrl },
  //       { property: "og:image:type", content: "image/jpeg" },
  //       { property: "og:image:width", content: "96" },
  //       { property: "og:image:height", content: "45" }
  //     ],
  //   }
  // }

  get mobile() {
    // @ts-ignore
    return this.$vuetify.breakpoint.sm;
  }

  get showFolderView() {
    const children = this.collectionFolder?.get_children();
    return children !== null && children !== undefined && children.length > 1;
  }

  get isLoadingState() {
    return this.componentState == ComponentState.LoadingResources;
  }

  get isReadyToStartState() {
    return this.componentState == ComponentState.ReadyToStart;
  }

  get coordText() {
    if (this.wwtRenderType == ImageSetType.sky) {
      return `${fmtHours(this.wwtRARad)} ${fmtDegLat(this.wwtDecRad)}`;
    }

    return `${fmtDegLon(this.wwtRARad)} ${fmtDegLat(this.wwtDecRad)}`;
  }

  get curBackgroundImagesetName() {
    if (this.wwtBackgroundImageset == null) return "";
    return this.wwtBackgroundImageset.get_name();
  }

  set curBackgroundImagesetName(name: string) {
    this.setBackgroundImageByName(name);
  }

  get crossfadeOpacity() {
    return this.cfOpacity;
  }

  set crossfadeOpacity(o: number) {
    this.setForegroundOpacity(o);
    if (this.hubbleLayer) {
      applyImageSetLayerSetting(this.hubbleLayer, ["opacity", 1 - 0.01 * o]);
    }
  }

  get fullscreenAvailable() {
    return screenfull.isEnabled;
  }

  get showBackgroundChooser() {
    if (this.wwtIsTourPlaying) return false;

    // TODO: we should wire in choices for other modes!
    return this.wwtRenderType == ImageSetType.sky;
  }

  get showCrossfader() {
    if (this.wwtIsTourPlaying) return false; // maybe show this if tour player is active but not playing?

    if (
      this.wwtForegroundImageset == null ||
      this.wwtForegroundImageset === undefined
    )
      return false;

    return this.wwtForegroundImageset != this.wwtBackgroundImageset;
  }

  get showPlaybackControls() {
    return this.wwtIsTourPlayerActive && !this.wwtIsTourPlaying;
  }

  get showToolMenu() {
    // This should return true if there are any tools to show.
    return (
      this.showBackgroundChooser ||
      this.showCrossfader ||
      this.showPlaybackControls
    );
  }

  async created() {
    let prom = this.waitForReady().then(() => {
      for (const s of this.embedSettings.asSettings()) {
        this.applySetting(s);
      }
    });

    if (this.embedSettings.tourUrl.length) {
      prom = prom.then(async () => {
        // TODO: figure out a good thing to do here
        this.backgroundImagesets = [...skyBackgroundImagesets];

        await this.loadTour({
          url: this.embedSettings.tourUrl,
          play: false,
        });

        this.componentState = ComponentState.ReadyToStart;
        this.setTourPlayerLeaveSettingsWhenStopped(true);
        this.currentTool = "playback-controls";
      });
    } else {
      // Many more possibilities if we're not playing a tour ...
      if (this.embedSettings.wtmlUrl.length) {
        prom = prom.then(async () => {
          const folder = await this.loadImageCollection({
            url: this.embedSettings.wtmlUrl,
            loadChildFolders: false,
          });

          if (this.embedSettings.wtmlPlace) {
            // Currently, there is an issue with the `places` field of a `Folder`
            // object populating correctly. Thus, we iterate over `children` instead
            for (const pl of folder.get_children() ?? []) {
              if (!(pl instanceof Place)) {
                continue;
              }
              if (pl.get_name() == this.embedSettings.wtmlPlace) {
                /* This is nominally an async Action, but with `instant: true` it's ... instant */
                this.gotoTarget({
                  place: pl,
                  noZoom: false,
                  instant: true,
                  trackObject: true,
                });
              }
            }
          }
        });
      }

      prom.then(() => {
        // setupForImageset() will apply a default background that is appropriate
        // for the foreground, but we want to be able to override it.

        let backgroundWasInitialized = false;
        let bgName = this.embedSettings.backgroundImagesetName;

        if (this.embedSettings.foregroundImagesetName.length) {
          const img = this.lookupImageset(
            this.embedSettings.foregroundImagesetName
          );

          if (img !== null) {
            // If the imageset is a panorama, we want to set it to be the background
            const isPanorama = img.get_dataSetType() == ImageSetType.panorama;
            const options: SetupForImagesetOptions = { foreground: img };
            if (isPanorama) {
              options.background = img;
              backgroundWasInitialized = true;
            }

            // For setup of planetary modes to work, we need to pass the specified
            // background imageset to setupForImageset().
            // For a panorama, we've already set the imageset itself as the background
            if (!isPanorama && bgName.length) {
              const bkg = this.lookupImageset(bgName);
              if (bkg !== null) {
                options.background = bkg;
                backgroundWasInitialized = true;
              }
            }

            this.setupForImageset(options);
          }
        }

        this.loadImageCollection({
          url: this.bgWtml,
          loadChildFolders: true,
        }).then((_folder) => {
          this.curBackgroundImagesetName = this.bgName;
          this.backgroundImagesets.unshift(
            new BackgroundImageset("unWISE", "unwise")
          );
        });

        this.loadImageCollection({
          url: this.hubbleWtmlUrl,
          loadChildFolders: false
        }).then((folder) => {
          const children = folder.get_children();
          if (children == null) { return; }
          const item = children[0] as Place;
          const imageset = item.get_backgroundImageset() ?? item.get_studyImageset();
          if (imageset === null) { return; }
          this.addImageSetLayer({
            url: imageset.get_url(),
            mode: "autodetect",
            name: "Hubble Carina",
            goto: false
          }).then((layer) => {
            this.hubbleLayer = layer;
            console.log(this.hubbleLayer);
            applyImageSetLayerSetting(layer , ["opacity", 0.5]);
          });
        });

        this.loadImageCollection({
          url: this.jwstWtmlUrl,
          loadChildFolders: true,
        }).then((folder) => {
          this.collectionFolder = folder;
          const children = folder.get_children();
          if (children === null) {
            return;
          }
          if (children.length === 1) {
            const item = children[0];
            if (item instanceof Place) {
              item.set_zoomLevel(0.277); // To match the video
              this.gotoTarget({
                place: item,
                noZoom: false,
                instant: true,
                trackObject: true,
              });
              this.setForegroundOpacity(50);
            }
          }
        });

        if (!backgroundWasInitialized) {
          if (!bgName.length) {
            // Empty bgname implies that we should choose a default background. If
            // setupForImageset() didn't do that for us, go with:
            bgName = "Digitized Sky Survey (Color)";
          }

          this.setBackgroundImageByName(bgName);
        }

        // TODO: DTRT in different modes.
        this.backgroundImagesets = [...skyBackgroundImagesets];
        let foundBG = false;

        for (const bgi of this.backgroundImagesets) {
          if (bgi.imagesetName == bgName) {
            foundBG = true;
            break;
          }
        }

        if (!foundBG) {
          this.backgroundImagesets.unshift(
            new BackgroundImageset(bgName, bgName)
          );
        }

        this.componentState = ComponentState.Started;
      });
    }
  }

  mounted() {
    if (screenfull.isEnabled) {
      screenfull.on("change", this.onFullscreenEvent);
    }

    window.addEventListener("resize", this.onResizeEvent);
    // ResizeObserver not yet in TypeScript but we should start using it when
    // available. If we're in an iframe, our shape might change spontaneously.
    // const ro = new ResizeObserver(entries => this.onResizeEvent());
    // ro.observer(this.$el);
    this.onResizeEvent();
  }

  destroyed() {
    if (screenfull.isEnabled) {
      screenfull.off("change", this.onFullscreenEvent);
    }

    window.removeEventListener("resize", this.onResizeEvent);
  }

  selectTool(name: ToolType) {
    if (this.currentTool == name) {
      this.currentTool = null;
    } else {
      this.currentTool = name;
    }
  }

  selectBottomSheet(name: BottomSheetType) {
    if (this.bottomSheet == name) {
      this.bottomSheet = null;
    } else {
      this.bottomSheet = name;
    }
  }

  get showVideoSheet() {
    return this.bottomSheet === 'video';
  }
  set showVideoSheet(_value) {
    this.selectBottomSheet('video');
  }

  get showTextSheet() {
    return this.bottomSheet === 'text';
  }
  set showTextSheet(_value) {
    this.selectBottomSheet('text');
  }


  doZoom(zoomIn: boolean) {
    if (zoomIn) {
      this.zoom(1 / 1.3);
    } else {
      this.zoom(1.3);
    }
  }

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }

  onFullscreenEvent() {
    // NB: we need the isEnabled check to make TypeScript happy even though it
    // is not necessary in practice here.
    if (screenfull.isEnabled) {
      this.fullscreenModeActive = screenfull.isFullscreen;
    }
  }

  onResizeEvent() {
    const width = this.$el.clientWidth;
    const height = this.$el.clientHeight;

    if (width > 0 && height > 0) {
      this.windowShape = { width, height };
    } else {
      this.windowShape = defaultWindowShape;
    }
  }

  startInteractive() {
    this.componentState = ComponentState.Started;

    if (this.embedSettings.tourUrl.length) {
      this.startTour();
    }
  }

  get tourPlaybackIcon() {
    if (this.tourPlaybackJustEnded) {
      return "undo-alt";
    }

    if (this.wwtIsTourPlaying) {
      return "pause";
    }

    return "play";
  }

  tourPlaybackButtonClicked() {
    if (this.wwtIsTourPlayerActive) {
      // If we're playing and our window is tall, we have styling active that
      // keeps the WWT widget in a widescreen-ish format to preserve tour
      // layout. If we're stopping playback, this styling will go away. Since
      // the WWT widget tracks its view height as an angular size, we need to
      // tweak it in order to preserve continuity when the tour is paused. This
      // isn't 100% necessary but is cool when it works. It doesn't work if the
      // pause occurs in a very zoomed-out state, where we can't zoom out any
      // farther because we hit the zoom clamps.
      //
      // Keep this in sync with wwtComponentLayout.
      //
      // TODO: make sure this works in 3D mode.
      let newView = null;

      if (this.wwtIsTourPlaying && this.wwtComponentLayout.top != "0") {
        const curHeight = this.windowShape.width * 0.75;
        newView = {
          raRad: 1.0 * this.wwtRARad,
          decRad: 1.0 * this.wwtDecRad,
          zoomDeg: (this.wwtZoomDeg * this.windowShape.height) / curHeight,
          instant: true,
        };
      }

      if (this.tourPlaybackJustEnded) {
        // Restart from beginning. (seekToTourTimecode() starts playback.)
        this.seekToTourTimecode(0);
        this.tourPlaybackJustEnded = false;
      } else {
        this.toggleTourPlayPauseState();
      }

      if (newView !== null) {
        this.gotoRADecZoom(newView);
      }
    }
  }

  formatTimecode(seconds: number): string {
    if (seconds < 0) return "-:--";

    const minutes = Math.floor(seconds / 60);
    seconds = Math.round(seconds - 60 * minutes);
    return minutes.toString() + ":" + seconds.toString().padStart(2, "0");
  }

  get twoWayTourTimecode() {
    return this.wwtTourTimecode;
  }

  set twoWayTourTimecode(code: number) {
    this.seekToTourTimecode(code);
    this.tourPlaybackJustEnded = false;
  }

  @Watch("wwtTourCompletions")
  onTourCompletionsChanged(_count: number) {
    this.tourPlaybackJustEnded = true;
  }

  // This property is used to achieve a widescreen effect when playing tours
  // back on a portrait-mode screen, such as on a mobile device. Tours have to
  // be designed with a target screen aspect ratio in mind, so without the
  // widescreen effect the content will get cut off.
  //
  // Keep this in sync with toggleTourPlayback.
  get wwtComponentLayout(): WwtComponentLayout {
    if (this.wwtIsTourPlaying) {
      if (this.windowShape.height > this.windowShape.width) {
        const wwtHeight = this.windowShape.width * 0.75; // => 4:3 aspect ratio
        const height = wwtHeight + "px";
        const top = 0.5 * (this.windowShape.height - wwtHeight) + "px";
        return { top, height };
      }
    }
    return { top: "0", height: "100%" };
  }
}
</script>

<style lang="less">
html {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #000;
}

body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;

  font-family: Verdana, Arial, Helvetica, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;

  .wwtelescope-component {
    position: relative;
    top: 0;
    width: 100%;
    height: 100%;
    border-style: none;
    border-width: 0;
    margin: 0;
    padding: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.modal {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 100;

  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

#modal-loading {
  background-color: #000;

  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    .spinner {
      background-image: url("assets/lunar_loader.gif");
      background-repeat: no-repeat;
      background-size: contain;
      width: 3rem;
      height: 3rem;
    }

    p {
      margin: 0 0 0 1rem;
      padding: 0;
      font-size: 150%;
    }
  }
}

#modal-readytostart {
  cursor: pointer;
  color: #999;

  &:hover {
    color: #2aa5f7;
  }

  div {
    margin: 0;
    padding: 0;
    background-image: url("assets/wwt_globe_bg.png");
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    width: 20rem;
    height: 20rem;
    max-width: 70%;
    max-height: 70%;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon {
      width: 60%;
      height: 60%;
      margin-left: 14%;
      margin-top: 3%;
    }
  }
}

#overlays {
  position: absolute;
  z-index: 10;
  top: 0.5rem;
  left: 0.5rem;
  color: #fff;

  p {
    margin: 0;
    padding: 0;
    line-height: 1;
  }
}

#bottom-content {
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  width: calc(100% - 1rem);
  pointer-events: none;
  align-items: center;
  gap: 25px;
}

#left-controls {
  list-style-type: none;
  margin: 0;
  padding: 0;
  color: #fff;


  li {
    padding: 3px;
    height: 22px;
    pointer-events: auto;
    cursor: pointer;
  }
}

#controls {
  position: absolute;
  z-index: 10;
  top: 0.5rem;
  right: 0.5rem;
  color: #fff;

  list-style-type: none;
  margin: 0;
  padding: 0;

  li {
    padding: 3px;
    height: 22px;
    cursor: pointer;

    .nudgeright1 {
      padding-left: 3px;
    }
  }
}

#tools {
  z-index: 10;
  color: #fff;

  .opacity-range {
    width: 50vw;
  }

  .clickable {
    cursor: pointer;
  }

  select {
    background: white;
    color: black;
    border-radius: 3px;
  }
}

.playback-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 75vw;

  .clickable {
    margin: 0 8px;
    cursor: pointer;
  }

  .scrubber {
    flex: 1;
    cursor: pointer;
  }
}

.tool-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  pointer-events: auto;
}

#credits {
  color: #ddd;
  font-size: 70%;
  justify-self: flex-end;
  align-self: flex-end;
  display: flex;
  justify-content: center;
  align-items: center;

  p {
    margin: 0;
    padding: 0;
    line-height: 1;
  }

  a {
    text-decoration: none;
    color: #fff;
    pointer-events: auto;

    &:hover {
      text-decoration: underline;
    }

    &[class^="share-network"]:hover {
      text-decoration: none;
      filter: brightness(75%);
    }
  }

  img {
    height: 24px;
    vertical-align: middle;
    margin: 2px;
  }

  svg {
    vertical-align: middle;
    height: 24px;
  }
}

/* Generic v-tooltip CSS derived from: https://github.com/Akryum/v-tooltip#sass--less */

.tooltip {
  display: block !important;
  z-index: 10000;

  .tooltip-inner {
    background: black;
    color: white;
    border-radius: 16px;
    padding: 5px 10px 4px;
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-style: solid;
    position: absolute;
    margin: 5px;
    border-color: black;
    z-index: 1;
  }

  &[x-placement^="top"] {
    margin-bottom: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 0 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      bottom: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^="bottom"] {
    margin-top: 5px;

    .tooltip-arrow {
      border-width: 0 5px 5px 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-top-color: transparent !important;
      top: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^="right"] {
    margin-left: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 5px 0;
      border-left-color: transparent !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
      left: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &[x-placement^="left"] {
    margin-right: 5px;

    .tooltip-arrow {
      border-width: 5px 0 5px 5px;
      border-top-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      right: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &.popover {
    .popover-inner {
      background: #f9f9f9;
      color: black;
      padding: 8px;
      border-radius: 5px;
    }

    .popover-arrow {
      border-color: #f9f9f9;
    }
  }

  &[aria-hidden="true"] {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.15s, visibility 0.15s;
  }

  &[aria-hidden="false"] {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.15s;
  }
}

/* Specialized styling for popups */

ul.tool-menu {
  list-style-type: none;
  margin: 0px;
  padding: 0px;

  li {
    padding: 3px;

    a {
      text-decoration: none;
      color: inherit;
      display: block;
      width: 100%;
    }

    svg.svg-inline--fa {
      width: 1.5em;
    }

    &:hover {
      background-color: #000;
      color: #fff;
    }
  }
}

#network-sharing-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 5px;
  flex-shrink: 1;
}


.facebook-button {
  border-radius: 8px;
  padding: 4px;
}

.twitter-button {
  border-radius: 10px;
  padding: 4px;
}

.control-icon {
  pointer-events: auto;
}

.control-icon-wrapper {
  color: #F0AB52;
  background: #040404;
  padding: 6px;
  border: 1px solid #F0AB52;
  border-radius: 20px;
  display: flex;
  align-items: center;
}

#text-icon-wrapper {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

#video-icon-wrapper {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
}

.ui-text {
  color: #F0AB52;
  background: black;
  padding: 5px 5px;
  border: 2px solid black;
  border-radius: 10px;
}

.slider-label {
  font-weight: bold;
  padding: 5px 10px;
}

.v-bottom-sheet {
  background: black;
}

.v-dialog--fullscreen {
  background: black;
  overflow-y: hidden;
}

.info-text {
  height: 35vh;
}

.video-wrapper {
  height: 100%;
  background: black;
}

.close-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 15;
}

video {
  object-fit: fill;
  width: 100%;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.scrollable {
  overflow-y: auto;
}

.no-bottom-border-radius {
  border-bottom-left-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
}

#mobile-tabs {
  padding-bottom: 2px !important;
}

@media(max-width: 600px) {
  #left-controls {
    display: block;
  }

  #video-dialog {
    display: inherit;
  }
}

@media(orientation: landscape) {
  video {
    height: 100%;
    object-fit: contain;
  }
}
</style>
