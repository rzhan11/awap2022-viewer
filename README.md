# AWAP 2022 Viewer

This is the viewer for AWAP 2022 game. Run matches between bots using the [game engine](https://github.com/rzhan11/awap2022-engine-public.git). Upload the generated replay files to this viewer to view the match.

This also contains a mapmaker tool for the game. Competitors are encouraged to create their own custom maps to ensure that their bot works for various kinds of maps (the final competition's maps will be hidden and will not be the same as the initially given maps).

To access the viewer/mapmaker without locally installing this repo, use the following links
* [Viewer link](http://awap2022.com:8080/viewer)
* [Mapmaker link](http://awap2022.com:8080/mapmaker)

### Requirements:
* [Node.js](https://nodejs.org/en/download/)
* [Chrome](https://www.google.com/chrome/) (preferred, other browsers may work)

## How-to:

### Download
* `git clone https://github.com/rzhan11/awap2022-viewer.git` - Downloads the repo
* `npm install` - Run once after downloading repo (downloads necessary packages)

### Viewer
* `cd` into this repo
* `npm start` - Starts the local server (if not running yet)
* Open http://localhost:8080/
* Upload a replay file (match replays are saved in the `replays/` folder of the engine repo)

### Mapmaker:
* `cd` into this repo
* `npm start` - Starts the local server (if not running yet)
* Open http://localhost:8080/mapmaker
* Use mapmaker tool to create map
    * Select map settings (map width, map height, symmetry)
    * `Init map` to apply map settings
    * Add generators, population, passability to the map
    * `Download map` when finished
* Save map to `maps/` folder of the engine repo
