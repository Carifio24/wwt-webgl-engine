# 🚨🚨 This is a Fork! 🚨🚨

This branch is a fork of [the main wwt-webgl-engine repo][main] to implement the
a custom viewer. Unless you're specifically interested in this app, you should
[go to the main repo][main].

[main]: https://github.com/WorldWideTelescope/wwt-webgl-engine/


## Custom App Workflow

1. Make sure custom `engine/wwtlib/bin/wwtlib.js` is downloaded.
2. Determine data WTML URL. Validate:
   1. First folder item is `<Place>` of interest
   2. Any custom background imagesets are listed.
3. Edit `embed/public/index.html`:
   1. Custom `og:url` dest URL for app
   2. Custom descriptive `og:title`, `<title>` from release
   3. Custom `og:description`
   4. Update `og:image`, `twitter:image` with planned preview image URL.
   5. Update `og:image:alt`, `twitter:image:alt` with planned preview image description.
4. Edit `embed/src/main.ts`:
   1. Update `jwstWtmlUrl` to data WTML.
   2. Update `url` to match dest URL above.
   3. Update `thumbnailUrl` to `og:image` above.
   4. Possibly update `bgName`.
5. Edit `embed/src/Embed.vue`:
   1. Update `<h1>` in image description to title.
   2. Update image description to press release teaser.
   3. Update Read More link and description (destination domain) to press
      release.
   4. Update GitHub repo link in "Powered by" footer.
   5. Update "Description" in Component preamble to match title (this will be
      the text filled in with any generated tweet).
   6. Possibly update hashtags.
   7. Possibly update `showFolderView` function if appropriate.
   8. Update `openSourceLink` with custom `bit.ly` so we can count clicks sent
      to the press release.
   9. Review `this.backgroundImagesets.unshift` line for necessary
      customization.
6. `npm run build` to check build.
7. `npm run serve-embed` and test app.
