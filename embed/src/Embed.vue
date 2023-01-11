<template>
  <v-app id="app">
    <WorldWideTelescope
      wwt-namespace="wwt-embed"
      v-bind:style="{
        height: wwtComponentLayout.height,
        top: wwtComponentLayout.top,
      }"
    ></WorldWideTelescope>

    <v-fade-transition>
      <v-overlay
        v-if="showSplashScreen"
        absolute
        opacity="0.6"
      >
        <img
          id="splash-screen"
          :src="imageLocation"
          v-click-outside="closeSplashScreenIfLoaded"
          max-width="70vw"
          max-height="70vh"
          contain
        >
          <a
            style="position: absolute; top: 6%; left: 89.5%; height: 3%; width: 2%;"
            @click="showSplashScreen = false">
          </a>
        </img>
      </v-overlay>
    </v-fade-transition>

    <transition name="fade">
      <div class="modal" id="modal-loading" v-show="isLoadingState">
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

    <div id="top-content">
      <v-tooltip
        v-model="showTooltip['video']"
        :open-on-click="false"
        :open-on-focus="false"
        :open-on-hover="true"
        right
      >
        <template v-slot:activator="{ on, attrs }">
          <div
            @mouseover="showTooltip['video'] = true"
            @mouseleave="showTooltip['video'] = false"
            id="video-icon-wrapper"
            class="control-icon-wrapper"
            v-on="on"
            v-bind="attrs"
            @click="selectBottomSheet('video')"
          >
            <font-awesome-icon
              id="video-icon"
              class="control-icon"
              icon="video"
              size="lg"
              
            ></font-awesome-icon>
          </div>
        </template>
        <span>Watch video</span>
      </v-tooltip>
      <div id="center-buttons-wrapper">
        <button
          id="show-layers-button"
          class="ui-text"
          @click="showLayers = !showLayers">
          {{ showLayers ? "Hide Images" : "Show Images" }}
        </button>
        <v-tooltip
          bottom
          :open-on-click="false"
          :open-on-focus="false"
          :open-on-hover="true"
          v-model="showTooltip['reset']"
        >
          <template v-slot:activator="{ on, attrs }">
            <div
              @mouseover="showTooltip['reset'] = true"
              @mouseleave="showTooltip['reset'] = false"
              id="reset-icon-wrapper"
              class="control-icon-wrapper"
              v-on="on"
              v-bind="attrs"
              @click="resetView(false)"
            >
              <font-awesome-icon
                id="reset-icon"
                class="control-icon"
                icon="redo"
                size="lg"
              ></font-awesome-icon>
            </div>
          </template>
          <span>Return to Carina</span>
        </v-tooltip>
      </div>
      <v-tooltip
        left
        :open-on-click="false"
        :open-on-focus="false"
        :open-on-hover="true"
        v-model="showTooltip['text']"
      >
        <template v-slot:activator="{ on, attrs }">
          <div
            id="text-icon-wrapper"
            class="control-icon-wrapper"
            @mouseover="showTooltip['text'] = true"
            @mouseleave="showTooltip['text'] = false"
            v-on="on"
            v-bind="attrs"
            @click="selectBottomSheet('text')"
          >
            <font-awesome-icon
              id="text-icon"
              class="control-icon"
              icon="book-open"
              size="lg"
            ></font-awesome-icon>
          </div>
        </template>
        <span>Learn more</span>
      </v-tooltip>
    </div>

    <div id="bottom-content">
      <div id="tools" v-if="showLayers">
        <div class="tool-container">
          <template v-if="currentTool == 'crossfade'">
            <span class="ui-text slider-label">Hubble<br><span class="light-type">(Visible)</span></span>
            <input
              class="opacity-range"
              type="range"
              v-model="crossfadeOpacity"
            />
            <span class="ui-text slider-label">JWST<br><span class="light-type">(Infrared)</span></span>
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
            >WorldWide Telescope</a
          >
        </div>
        <div id="icons-container">
          <a href="https://www.cosmicds.cfa.harvard.edu/"
            ><img alt="CosmicDS Logo" src="./assets/logo_cosmicds.jpg"
          /></a>
          <a href="https://worldwidetelescope.org/home/"
            ><img alt="WWT Logo" src="./assets/logo_wwt.png"
          /></a>
          <a href="https://science.nasa.gov/learners"
            ><img alt="SciAct Logo" src="./assets/logo_sciact.png"
          /></a>
          <!-- <ShareNetwork
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
          </ShareNetwork> -->
        </div>
      </div>
    </div>

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
          <source src="./assets/carina_demo.mp4" type="video/mp4">
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
        id="tabs"
        dense
        grow
      >
        <v-tabs-slider color="white"></v-tabs-slider>

        <v-tab><h3>Information</h3></v-tab>
        <v-tab><h3>Using WWT</h3></v-tab>
      </v-tabs>
      <font-awesome-icon
        id="close-text-icon"
        class="control-icon"
        icon="times"
        size="lg"
        @click="showTextSheet = false"
      ></font-awesome-icon>
        <v-tabs-items v-model="tab" id="tab-items" class="pb-2 no-bottom-border-radius">
          <v-tab-item class="scrollable">
            <v-card class="no-bottom-border-radius">
              <v-card-text class="info-text no-bottom-border-radius">
                <h4>Explore!</h4>
                As scientists, we learn by observing and noticing. Explore these images of the Carina Nebula and see what you can find.<br>
                • Look for stars that are “invisible” to our eyes because they are blocked by dust but shine in JWST’s infrared image.<br>
                • Look near the edge of the dusty, dense clouds in the JWST image. See if you can find bright yellow arcs that indicate gas and dust being blown away by young forming stars.<br>
                • Scan the dark blue region of the JWST image and see if you can find reddish smudgy objects that might be galaxies. Switch over to the Hubble image. Do you see those galaxies in the Hubble image?<br>
                <br>
                <h4>Images as “data”</h4>
                When you think about scientific data, pictures might not immediately spring to mind, but in astronomy, images are some of the most important pieces of data available.
                <br><br>
                Images show us the structure of objects in space, which here provides clues on how stars form and evolve. In the Hubble and JWST images of the Carina Nebula, you can see regions of very high density dust and gas (the brown parts of the images) where new stars are being born. If you zoom out, you will see that the images are at the edge of what appears to be a larger bubble, which is the cavern of lower density gas carved out by winds from massive stars.
                <br><br>
                <h4>Visible vs Infrared Light</h4>
                Our eyes can detect visible light, but visible light is only a small part of a broader spectrum of light that has different energies, ranging from gamma rays and x-rays to infrared light and radio waves. Images from each part of the spectrum can tell a different part of the story about objects in space.
                <br><br>
                The Hubble Space Telescope takes pictures in visible light, like our eyes. The James Webb Space Telescope takes pictures in infrared light. Some “night vision” cameras image objects in the dark using infrared light. Animals and people “glow” in infrared in the dark because we usually have higher temperatures than our surroundings.
                <br><br><br>
                <h3>Credits:</h3>
                <h4>CosmicDS Mini Stories Team:</h4>
                Jon Carifio<br>
                John Lewis<br>
                Pat Udomprasert<br>
                Alyssa Goodman<br>
                Mary Dussault<br>
                Sue Sunbury<br>
                <br>
                <h4>WorldWide Telescope Team:</h4>
                Peter Williams<br>
                David Weigel<br>
                Jon Carifio<br>
              </v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item class="scrollable">
            <v-card class="no-bottom-border-radius" style="height: 100%;">
              <v-card-text class="info-text no-bottom-border-radius">
                <v-container>
                  <v-row align="center">
                    <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Pan
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-2">
                      <strong>{{ touchscreen ? "press + drag" : "click + drag" }}</strong><br>
                
                    </v-col>
                  </v-row>
                  <v-row align="center">
                    <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Zoom
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-2">
                      <strong>{{ touchscreen ? "pinch in and out" : "scroll in and out" }}</strong><br>
                      
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <div
                        style="min-height: 120px;"
                      >
                        <p>
                          The frame above provides an <b>interactive view </b>of the night sky, powered by WorldWide Telescope (WWT), using images from real observations.
                        </p>
                        <p>
                          The brighter band you see going diagonally across the frame (before you try the controls) is caused by stars and dust in our home galaxy, called the <b>Milky Way.</b>
                        </p>
                        <p>
                          You can explore this view and see what is in the night sky, as astronomers have been doing for centuries. <b>Pan</b> (click and drag) and <b>zoom</b> (scroll in and out) to see parts of the sky beyond this view.
                        </p>
                      </div>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <h3>Credits:</h3>
                      <h4>CosmicDS Mini Stories Team:</h4>
                      Jon Carifio<br>
                      John Lewis<br>
                      Pat Udomprasert<br>
                      Alyssa Goodman<br>
                      Mary Dussault<br>
                      Sue Sunbury<br>
                      <br>
                      <h4>WorldWide Telescope Team:</h4>
                      Peter Williams<br>
                      David Weigel<br>
                      Jon Carifio<br>
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
  title = "Compare JWST and Hubble images of Carina!";
  description = "Pan, zoom, and compare the images using AAS WorldWide Telescope.";
  hashtags = ["jwst", "hubble", "wwt", "carina", "unfoldtheuniverse"];

  bottomSheet: BottomSheetType = null;
  hubbleLayer: ImageSetLayer | null = null;
  jwstLayer: ImageSetLayer | null = null;
  
  cfOpacity: number = 50;
  tab: number = 0;
  showSplashScreen = true;
  showLayers = true;
  touchscreen: boolean = false;
  showTooltip = {};

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

  get mobileSize() {
    // @ts-ignore
    return this.$vuetify.breakpoint.mobile;
  }

  get mobile() {
    return this.mobileSize && this.touchscreen;
  }

  get imageLocation() {
    return require(`./assets/Carina Nebula Splash Screen${this.mobile ? ' Mobile' : ''} Close.png`);
  }

  get showFolderView() {
    const children = this.collectionFolder?.get_children();
    return children !== null && children !== undefined && children.length > 1;
  }

  get isLoadingState() {
    return this.componentState == ComponentState.LoadingResources || !this.layersLoaded;
  }

  get isReadyToStartState() {
    return this.componentState == ComponentState.ReadyToStart && this.layersLoaded;
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
    if (this.hubbleLayer) {
      applyImageSetLayerSetting(this.hubbleLayer, ["opacity", 1 - 0.01 * o]);
    }
    if (this.jwstLayer) {
      applyImageSetLayerSetting(this.jwstLayer, ["opacity", 0.01 * o]);
    }
    this.cfOpacity = o;
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
    this.touchscreen = matchMedia('(hover: none)').matches;

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
            applyImageSetLayerSetting(layer , ["opacity", 0.5]);
          });
        });

        this.loadImageCollection({
          url: this.jwstWtmlUrl,
          loadChildFolders: false
        }).then((folder) => {
          const children = folder.get_children();
          if (children == null) { return; }
          const item = children[0] as Place;
          const imageset = item.get_backgroundImageset() ?? item.get_studyImageset();
          if (imageset === null) { return; }
          this.setForegroundOpacity(0);
          this.addImageSetLayer({
            url: imageset.get_url(),
            mode: "autodetect",
            name: "JWST Carina",
            goto: false
          }).then((layer) => {
            this.jwstLayer = layer;
            this.resetView();
            applyImageSetLayerSetting(layer , ["opacity", 0.5]);
          });
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
      this.$nextTick(() => {
        this.blurActiveElement();
      });
    } else {
      this.bottomSheet = name;
    }
  }

  get layersLoaded() {
    return this.hubbleLayer != null && this.jwstLayer != null;
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

  blurActiveElement() {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
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

  resetView(instant: boolean = true) {
    const D2R = Math.PI / 180.0;
    if (this.jwstLayer === null) { return; }
    const imageset = this.jwstLayer.get_imageSet();
    this.gotoRADecZoom({
      raRad: D2R * imageset.get_centerX(),
      decRad: D2R * imageset.get_centerY(),
      zoomDeg: 0.8595,
      rollRad: 1.799,
      instant: instant,
    });
  }

  closeSplashScreenIfLoaded() {
    if (this.componentState == ComponentState.Started) {
      this.showSplashScreen = false;
    }
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

  @Watch("componentState")
  onComponentStateChanged(state: ComponentState) {
    if (state === ComponentState.Started) {
      this.showSplashScreen = true;
    }
  }

  @Watch("showLayers")
  onShowLayersChanged(show: boolean) {
    if (this.hubbleLayer) {
      applyImageSetLayerSetting(this.hubbleLayer, ["enabled", show]);
    }
    if (this.jwstLayer) {
      applyImageSetLayerSetting(this.jwstLayer, ["enabled", show]);
    }
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
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #000;
}

body {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;

  font-family: Verdana, Arial, Helvetica, sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
  margin: 0;

  .wwtelescope-component {
    position: relative;
    top: 0;
    width: 100%;
    height: 100vh;
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
  position: fixed;
  bottom: 0.5rem;
  right: 0.5rem;
  width: calc(100% - 1rem);
  pointer-events: none;
  align-items: center;
  gap: 5px;
}

#bottom-row {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
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
  font-size: calc(0.7em + 0.2vw);
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

  &:hover {
    cursor: pointer;
  }
}

.control-icon-wrapper {
  color: #F0AB52;
  background: #040404;
  padding: 6px;
  border: 1px solid #F0AB52;
  border-radius: 20px;
  display: flex;
  align-items: center;
  pointer-events: auto;

  &:hover {
    cursor: pointer;
  }
}

#top-content {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: calc(100% - 1rem);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  #center-buttons-wrapper {
    display: flex;
    flex-direction: row;
  }

  #right-button-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.ui-text {
  color: #F0AB52;
  background: black;
  padding: 5px 5px;
  border: 2px solid black;
  border-radius: 10px;
  font-size: calc(0.7em + 0.2vw);
}

.slider-label {
  font-weight: bold;
  font-size: calc(0.8em + 0.5vw);
  padding: 5px 10px;
  text-align: center;
  line-height: 20px;

  .light-type {
    font-size: calc(0.56em + 0.35vw);
  }
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
  text-align: center;
  z-index: 1000;
}

.close-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 15;
}

video {
  height: 100%;
  width: auto;
  object-fit: contain;
}

.scrollable {
  overflow-y: auto;
}

.no-bottom-border-radius {
  border-bottom-left-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
}

#tabs {
  width: calc(100% - 3em);
}

#tab-items {
  // padding-bottom: 2px !important;

  .v-card__text {
    font-size: ~"max(14px, calc(0.8em + 0.3vw))";
    padding-top: ~"max(2vw, 16px)";
    padding-left: ~"max(4vw, 16px)";
    padding-right: ~"max(4vw, 16px)";
  }

}

#close-text-icon {
  position: absolute;
  top: 0.25em;
  right: calc((3em - 0.6875em) / 3); // font-awesome-icons have width 0.6875em
  color: white;
}

#close-splash-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  color: #F0AB52;
}


#splash-screen {
  width: fit-content;
  height: fit-content;
  max-width: 70vw;
  max-height: 70vh;
  object-fit: contain;
}

#show-layers-button {
  font-size: calc(0.75em + 0.5vw);
  pointer-events: auto;
}

@media(max-width: 600px) {
  #left-controls {
    display: block;
  }

  #video-dialog {
    display: inherit;
  }
}
</style>
