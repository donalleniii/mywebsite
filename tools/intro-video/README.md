# Intro film source

The 22 second film at the top of the homepage is built in code, not in an editor.
`intro.html` is one deterministic animation: every frame is a function of time `t`,
so it renders the same way every time. The 3D model is the real painted
FormWright export from `assets/formwright/`.

## Change the words or timing

All copy lives in the HTML near the top of `intro.html`. Timing lives in
`renderFrame(t)` (search for `revealGroup`). Each scene is roughly four seconds:

| Time      | Scene                                              |
|-----------|----------------------------------------------------|
| 0 to 3s   | "Hi, I'm Don Allen III" over a painted brushstroke |
| 3 to 7s   | Build: FormWright model, wireframe then painted    |
| 7 to 11s  | Research: the model dissolves into Gaussian splats |
| 11 to 15s | Teach: splats become a crowd, a wave spreads out   |
| 15 to 19s | Advise: collaborators                              |
| 19 to 22s | End card: name, "Creative technologist"            |

## Preview and render

```bash
npm install
npm run serve            # in one terminal, serves the repo root on :8765
open "http://localhost:8765/tools/intro-video/intro.html?play=1"            # live preview
open "http://localhost:8765/tools/intro-video/intro.html?w=1080&h=1350&play=1" # phone cut
npm run stills           # quick JPEG stills at key moments
npm run render:wide      # 1920x1080 master, about 10 minutes
npm run render:tall      # 1080x1350 master for phones
```

Then encode the web versions into `assets/video/`:

```bash
ffmpeg -i master_16x9.mp4 -c:v libx264 -preset veryslow -tune animation -crf 27 \
  -pix_fmt yuv420p -movflags +faststart -an ../../assets/video/don-intro-16x9.mp4
ffmpeg -i master_4x5.mp4 -vf scale=864:1080:flags=lanczos -c:v libx264 -preset veryslow \
  -tune animation -crf 26 -pix_fmt yuv420p -movflags +faststart -an ../../assets/video/don-intro-4x5.mp4
ffmpeg -sseof -0.05 -i master_16x9.mp4 -frames:v 1 -q:v 3 ../../assets/video/don-intro-16x9-poster.jpg
ffmpeg -sseof -0.05 -i master_4x5.mp4 -vf scale=864:1080 -frames:v 1 -q:v 3 ../../assets/video/don-intro-4x5-poster.jpg
```

The page background (`#F1F2F4`) matches the film's background, which is what makes
the film blend into the page. Change both together.
