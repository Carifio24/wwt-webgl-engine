import { NightwatchBrowser, NightwatchTests } from "nightwatch";
import type { WebDriver } from "selenium-webdriver";
import { percyScreenshot } from "@percy/selenium-webdriver";

declare global {
  interface Window {
    wwtlib: WWTLib;
  }
}

type WWTLib = typeof import("@wwtelescope/engine");

type BrowserWithDriver = NightwatchBrowser & { driver: WebDriver };

type EngineTests = NightwatchTests & {
  browser: NightwatchBrowser;
};

const tests: EngineTests = {

  browser: null as unknown as BrowserWithDriver,

  before: function(browser: NightwatchBrowser) {
    this as EngineTests;
    browser.globals.waitForConditionTimeout = 30_000;
  },

  'Navigation and loading': async function (browser: BrowserWithDriver) {
    await browser.navigateTo("http://localhost:8080/tests/skeleton.html");
    await percyScreenshot(browser.driver, "Initial WWT initialization");
  },

  'Constellations': async function (browser: BrowserWithDriver) {
    await browser.execute(function () {
      const settings = window.wwtlib.Settings.get_active();
      settings.set_showConstellations(true);
      settings.set_showConstellationLabels(true);
      settings.set_showConstellationBoundries(true);
      settings.set_showConstellationSelection(true);
      settings.set_showConstellationFigures(true);
    });

    await percyScreenshot(browser.driver, "Constellations");
  },



  after: function(browser: NightwatchBrowser) {
    browser.end();
  }
};

module.exports = tests;
