# 🚨🚨 This is a Fork! 🚨🚨

This branch is a fork of [the main wwt-webgl-engine repo][main] to implement the
a custom viewer. Unless you're specifically interested in this app, you should
[go to the main repo][main].

[main]: https://github.com/WorldWideTelescope/wwt-webgl-engine/


## Custom App Workflow

1. Switch to a new branch with an appropriate name.
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
   3. Update image credits.
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
7. Iterate, checkpoint work into Git.
8. Push to GitHub to establish branch
9. `npm run serve-embed` and test app.
   1. General appearance, duh.
   2. Do *not* test social media buttons in case that leads them to cache a
      missing/bad preview for the final URL.
   2. "Learn more" link. Click counted on bit.ly?
   3. "Support WWT" link.
   4. GitHub link.
   5. Mobile display (via devtools).
9. Set up preview image:
   1. Take a good-sized screenshot to use for the preview.
   2. Crop it to 2:1 aspect ratio.
   3. Resize to 1200×600 size.
   4. Export it to `embed/public/preview.jpg`.
   5. Update preview-related parameters in `embed/public/index.html` if needed.
9. Upload preview image:
   1. Export `$AZURE_STORAGE_CONNECTION_STRING` for `wwtwebstatic` server.
   2. `npm run build` just to be safe.
   3. Sub in appropriate `!YYYY!` and `!DIRNAME!`, then:
      `az storage azcopy blob upload -c '$web' -r -s embed/dist/preview.jpg -d specials/!YYYY!/!DIRNAME!/`
