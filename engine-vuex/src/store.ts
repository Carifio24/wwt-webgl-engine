// Copyright 2020 the .NET Foundation
// Licensed under the MIT License

import Vue from "vue";
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

import { WWTSetting } from "@pkgw/engine-types";
import { WWTInstance } from "@pkgw/engine-helpers";

interface WWTLinkedCallback {
  (): void;
}

export class WWTGlobalState {
  inst: WWTInstance | null = null;
  onLinkedCallbacks: WWTLinkedCallback[] = [];

  link(inst: WWTInstance): void {
    if (this.inst !== null)
      throw new Error("must unlink WWT Vuex global state before relinking");

    this.inst = inst;

    for (const cb of this.onLinkedCallbacks) {
      cb();
    }

    this.onLinkedCallbacks = [];
  }

  unlink(): void {
    this.inst = null;
  }
}

/** This interface expresses the properties exposed by the WWT Engine’s
 * Vuex store module.
 */
export interface WWTEngineVuexState {
  /** The current right ascension of the view, in radians. */
  raRad: number;

  /** The current declination of the view, in radians. */
  decRad: number;

  /** The current WWT clock time of the view, as a UTC Date. */
  currentTime: Date;
}

/** The parameters for the [[WWTEngineVuexModule.gotoRADecZoom]] action. */
export interface GotoRADecZoomParams {
  /** The right ascension to go to, in radians. */
  raRad: number;

  /** The declination to go to, in radians. */
  decRad: number;

  /** The zoom level to go to, in *degrees*. This is the final angular height of
   * the WWT viewport. */
  zoomDeg: number;

  /** Whether the view should navigate instantly or pan smoothly.
   *
   * Smooth panning is generally preferable from a UX perspective because it
   * gives the engine time to download any data files that it may need to render
   * the view.
   */
  instant: boolean;
}

@Module({
  namespaced: true,
  stateFactory: true,
})
export class WWTEngineVuexModule extends VuexModule implements WWTEngineVuexState {
  raRad = 0.0;
  decRad = 0.0;
  currentTime = new Date();

  @Mutation
  internalLinkToInstance(wwt: WWTInstance): void {
    Vue.$wwt.link(wwt);
  }

  @Mutation
  internalUnlinkFromInstance(): void {
    Vue.$wwt.unlink();
  }

  @Mutation
  internalUpdateRA(newRARad: number): void {
    this.raRad = newRARad;
  }

  @Mutation
  internalUpdateDec(newDecRad: number): void {
    this.decRad = newDecRad;
  }

  @Mutation
  internalUpdateCurrentTime(newTime: Date): void {
    this.currentTime = newTime;
  }

  @Mutation
  applySetting(setting: WWTSetting): void {
    if (Vue.$wwt.inst === null)
      throw new Error('cannot applySetting without linking to WWTInstance');
    Vue.$wwt.inst.applySetting(setting);
  }

  @Mutation
  setBackgroundImageByName(imagesetName: string): void {
    if (Vue.$wwt.inst === null)
      throw new Error('cannot setBackgroundImageByName without linking to WWTInstance');
    Vue.$wwt.inst.setBackgroundImageByName(imagesetName);
  }

  @Mutation
  setForegroundImageByName(imagesetName: string): void {
    if (Vue.$wwt.inst === null)
      throw new Error('cannot setForegroundImageByName without linking to WWTInstance');
    Vue.$wwt.inst.setForegroundImageByName(imagesetName);
  }

  @Action({ rawError: true })
  async waitForReady(): Promise<void> {
    if (Vue.$wwt.inst !== null) {
      return Vue.$wwt.inst.waitForReady();
    } else {
      return new Promise((resolve, _reject) => {
        const waitThenResolve = (): void => {
          (Vue.$wwt.inst as WWTInstance).waitForReady().then(resolve);
        };

        if (Vue.$wwt.inst !== null) {
          waitThenResolve();
        } else {
          Vue.$wwt.onLinkedCallbacks.push(waitThenResolve);
        }
      });
    }
  }

  @Action({ rawError: true })
  async gotoRADecZoom(
    {raRad, decRad, zoomDeg, instant}: GotoRADecZoomParams
  ): Promise<void> {
    if (Vue.$wwt.inst === null)
      throw new Error('cannot gotoRADecZoom without linking to WWTInstance');
    await Vue.$wwt.inst.gotoRADecZoom(raRad, decRad, zoomDeg, instant);
  }
}