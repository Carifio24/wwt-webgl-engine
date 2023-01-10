import Vue from "vue";
import VTooltip from "v-tooltip";
import Vuex from "vuex";

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAdjust,
  faBookOpen,
  faCompress,
  faHeart,
  faExpand,
  faFileAlt,
  faMountain,
  faQuestion,
  faPlay,
  faPause,
  faRedo,
  faSearchMinus,
  faSearchPlus,
  faSlidersH,
  faStar,
  faTextHeight,
  faTimes,
  faUndoAlt,
  faVideo,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook,
  faTwitter
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';

import VueMeta from "vue-meta";
import VueSocialSharing from "vue-social-sharing";

import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

import { createPlugin } from "@wwtelescope/engine-vuex";
import { EmbedSettings } from "@wwtelescope/embed-common";
import FolderView from "./FolderView.vue";

import Embed from "./Embed.vue";

Vue.config.productionTip = false;

Vue.use(VTooltip);
Vue.use(Vuex);
Vue.use(VueMeta);
Vue.use(VueSocialSharing);
Vue.use(Vuetify);

const store = new Vuex.Store({});

const vuetify = new Vuetify({
  theme: { dark: true }
});

Vue.use(createPlugin(), {
  store,
  namespace: "wwt-embed"
});

library.add(faAdjust);
library.add(faCompress);
library.add(faExpand);
library.add(faHeart);
library.add(faMountain);
library.add(faPlay);
library.add(faPause);
library.add(faRedo);
library.add(faSearchMinus);
library.add(faSearchPlus);
library.add(faSlidersH);
library.add(faStar);
library.add(faUndoAlt);
library.add(faFacebook);
library.add(faTwitter);
library.add(faVideo);
library.add(faTextHeight);
library.add(faTimes);
library.add(faFileAlt);
library.add(faBookOpen);
library.add(faQuestion);
Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.component('vue-slider', VueSlider);
Vue.component('folder-view', FolderView);

const queryParams = new URLSearchParams(window.location.search);
const settings = EmbedSettings.fromQueryParams(queryParams.entries());

new Vue({
  store,
  vuetify,
  el: "#app",
  render: createElement => {
    return createElement(Embed, {
      props: {
        "wwtNamespace": "wwt-embed",
        "embedSettings": settings,
        "jwstWtmlUrl": "https://carifio24.github.io/wwt-webgl-engine/jwst_carina.wtml",
        "hubbleWtmlUrl": "https://carifio24.github.io/wwt-webgl-engine/carina_nebula.wtml",
        //"jwstWtmlUrl": "http://data1.wwtassets.org/packages/2022/07_jwst/jwst_first_v2.wtml",
        "url": "https://carifio24.github.io/wwt-webgl-engine/",
        "thumbnailUrl": "https://cdn.worldwidetelescope.org/thumbnails/jwst.jpg",
        "bgWtml": "https://data1.wwtassets.org/packages/2022/07_jwst/smacs0723/jwst_smacs0723.wtml",
        //"bgName": "Optical (Terapixel DSS)"
        "bgName": "unwise"
      }
    });
  }
});
