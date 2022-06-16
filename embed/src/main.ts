import Vue from "vue";
import VTooltip from "v-tooltip";
import Vuex from "vuex";

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAdjust,
  faCompress,
  faExpand,
  faMountain,
  faPlay,
  faPause,
  faRedo,
  faSearchMinus,
  faSearchPlus,
  faSlidersH,
  faUndoAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';

import { createPlugin } from "@wwtelescope/engine-vuex";
import { EmbedSettings } from "@wwtelescope/embed-common";
import TransitionExpand from "../../research-app/src/TransitionExpand.vue";
import FolderView from "./FolderView.vue";

import Embed from "./Embed.vue";

Vue.config.productionTip = false;

Vue.use(VTooltip);
Vue.use(Vuex);

const store = new Vuex.Store({});

Vue.use(createPlugin(), {
  store,
  namespace: "wwt-embed"
});

library.add(faAdjust);
library.add(faCompress);
library.add(faExpand);
library.add(faMountain);
library.add(faPlay);
library.add(faPause);
library.add(faRedo);
library.add(faSearchMinus);
library.add(faSearchPlus);
library.add(faSlidersH);
library.add(faUndoAlt);
Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.component('vue-slider', VueSlider);
Vue.component('transition-expand', TransitionExpand);

const queryParams = new URLSearchParams(window.location.search);
const settings = EmbedSettings.fromQueryParams(queryParams.entries());

new Vue({
  store,
  el: "#app",
  render: createElement => {
    return createElement(Embed, {
      props: {
        "wwtNamespace": "wwt-embed",
        "embedSettings": settings
      }
    });
  }
});