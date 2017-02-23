// WallpaperSwitcher -> Required by Components/CommandPanel
// --------------------------------------
// Serves to handle wallpaper switching through DOM manipulation.

import Inferno from 'inferno';
import Component from 'inferno-component';

import * as WallpaperOperations from "../Logic/WallpaperOperations";
import * as Settings from "../Logic/Settings";

const FADEOUT_TIME = 600;


export default class WallpaperSwitcher extends Component {
  constructor(props) {
    super(props);

    let wallpaperDirectory = WallpaperOperations.getWallpaperDirectory();
    let wallpapers = WallpaperOperations.getWallpapers(wallpaperDirectory);

    this.cyclerBackground = undefined;
    this.cyclerForeground = undefined;

    this.state = {
      "directory": wallpaperDirectory,
      "wallpapers": wallpapers,
      "selectedWallpaper": undefined,
      "savedWallpaper": undefined,
      "switcher": {
        "active": false,
        "currentlyFading": false,
        "index": 0
      }
    };
  }


  componentWillMount() {
    // Set background wallpaper
    let directory = this.state.directory;
    let image = Settings.requestSetting("wallpaper", "space-1.jpg");
    let cyclerBackground = document.querySelectorAll('.wallpaper-background')[0];
    let cyclerForeground = document.querySelectorAll('.wallpaper-foreground')[0];

    cyclerForeground.style.background = `url('${directory}${image}')`;
    cyclerForeground.style.backgroundSize = "cover";

    this.setState({
      "savedWallpaper": image,
      "cyclerBackground": cyclerBackground,
      "cyclerForeground": cyclerForeground
    });
  }


  acceptWallpaper() {
    let selectedWallpaper = this.state.selectedWallpaper;
    let switcher = this.state.switcher;

    // Due diligence.
    Settings.saveSetting("wallpaper", selectedWallpaper);
    window.notifications.generate("This wallpaper has been saved as your default background.", 'success');

    // Reset switcher state
    switcher.active = false;
    switcher.index = 0;

    this.setState({
      "selectedWallpaper": selectedWallpaper,
      "savedWallpaper": selectedWallpaper,
      "switcher": switcher
    });
  }


  cycleWallpaper() {
    // Prevent animation transitions stacking and causing issues.
    if (this.state.switcher.currentlyFading === true) {
      return false;
    }

    let wallpapers = this.state.wallpapers;
    let switcher = this.state.switcher;
    let index = (switcher.index + wallpapers.length + 1) % wallpapers.length;
    let newWallpaper = wallpapers[index];

    this.setWallpaper(newWallpaper);

    switcher.index = index;

    this.setState({
      "switcher": switcher
    });
  }


  handleSwitcherActivation() {
    let switcher = this.state.switcher;
    switcher.active = true;
    this.cycleWallpaper();

    this.setState({
      "switcher": switcher
    });
  }


  rejectWallpaper() {
    let savedWallpaper = this.state.savedWallpaper;
    let switcher = this.state.switcher;

    // Reset switcher state
    switcher.active = false;
    switcher.index = 0;

    this.setState({
      "switcher": switcher
    });

    this.setWallpaper(savedWallpaper);

    window.notifications.generate("Wallpaper reset to default, no changes saved.");
  }


  setWallpaper(newWallpaper) {
    let switcher = this.state.switcher;

    // Fadeout foreground wallpaper to new wallpaper
    let directory = this.state.directory;
    this.cyclerBackground.style.background = `url('${directory}${newWallpaper}')`;
    this.cyclerBackground.style.backgroundSize = 'cover';
    this.cyclerForeground.className += " fadeout";

    switcher.currentlyFading = true;

    setTimeout(() => {
      // Cycle new wallpaper back to the front, make it visible again.
      this.cyclerForeground.style.background = `url('${directory}${newWallpaper}')`;
      this.cyclerForeground.style.backgroundSize = 'cover';
      this.cyclerForeground.className = this.state.cyclerForeground.className.replace(" fadeout", "");

      let switcher = this.state.switcher;
      switcher.currentlyFading = false;

      this.setState({
        "selectedWallpaper": newWallpaper,
        "switcher": switcher
      });
    }, FADEOUT_TIME);
  }


  generateOptions() {
    let classes = ['options'];

    if (this.state.switcher.active === true) {
      classes.push("active");
    }

    return (
      <div className='options-wrapper'>
        <div className={ classes.join(' ') }>
          <div className="button-reject" onClick={ this.rejectWallpaper.bind(this) } >✕</div>
          <div className="button-accept" onClick={ this.acceptWallpaper.bind(this) } >✓</div>
        </div>
      </div>
    );
  }


  render() {
    let options = this.generateOptions();

    return (
      <div className="distro-wrapper">
        <div className="distro-logo" onClick={ this.handleSwitcherActivation.bind(this) }></div>
        { options }
      </div>
    );
  }
}
