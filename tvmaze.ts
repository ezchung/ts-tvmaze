import axios from "axios";
import * as $ from 'jquery';
import { ids } from "webpack";

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $episodesList = $("#episodesList");
const $searchForm = $("#searchForm");

const BASE_URL = "https://api.tvmaze.com";
const DEFAULT_IMG = 'https://tinyurl.com/tv-missing';

interface IShow {
  id: number;
  name: string;
  summary: string;
  image: string;
}

interface IEpisode {
  id: number;
  name: string;
  season: string;
  number: string;
}

interface IShowFromAPI {
  id: number,
  name: string,
  summary: string,
  image: { original: string; } | null;
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function getShowsByTerm(term: string): Promise<Array<IShow>> {
  const res = await axios.get(`${BASE_URL}/search/shows/?q=${term}`);

  return res.data.map((result: { show: IShowFromAPI; }): IShow => {
    const { id, name, summary, image } = result.show;
    return {
      id,
      name,
      summary,
      image: image?.original || DEFAULT_IMG
    };
  });

};

//Expecting an object with key of show with type of IShow

/** Given list of shows, create markup for each and append to DOM */

function populateShows(shows) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image}"
              alt="Bletchly Circle San Francisco"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}

/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val() as string;
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});


/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: number): Promise<Array<IEpisode>> {
  const res = await axios.get(`${BASE_URL}/shows/${id}/episodes`);
  const episodes = res.data.map((episode: IEpisode) => (episode));

  return episodes;
}


/** Renders episodes -> creates markup, and appends to the DOM.
 * Empties current episodes list.
 * Accepts: Array of episodes like
 * -      const episodes = [{id, name, season, number}, ...]
 * Returns: undefined
 */

function populateEpisodes(episodes: IEpisode[]): void {
  $episodesList.empty();

  for (let episode of episodes) {
    $episodesList.append(

      `<li>
      ${episode.name}
      (season ${episode.season}, number ${episode.number})
      </li>`
    );
  }

}

/** Fetch episodes from API, and render to the DOM.
 * Called by Button click ('Episodes' button), finds showID from evt.target
 * Shows Episodes area, and returns undefined
*/
async function getAndDisplayEpisode(evt: JQuery.ClickEvent) {
  /* Find ID by closest Show element in DOM. */
  const showId: number = $(evt.target).closest('.Show').data('show-id');
  const episodes = await getEpisodesOfShow(showId);

  populateEpisodes(episodes);

  $episodesArea.show();
}

$showsList.on("click", ".Show-getEpisodes", getAndDisplayEpisode);
