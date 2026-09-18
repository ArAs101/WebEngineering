import type { ReactElement } from 'react';
import type { Bear } from '../../scripts/types';
import CommentsSection from '../comments/CommentsSection';
import BearList from '../bears/BearList';
import HighlightedText from '../search/HighlightedText';

const wildBearImage = new URL('../../media/wild-bear.jpg', import.meta.url)
  .href;

const urbanBearImage = new URL('../../media/urban-bear.jpg', import.meta.url)
  .href;

const bearMp3 = new URL('../../media/bear.mp3', import.meta.url).href;
const bearOgg = new URL('../../media/bear.ogg', import.meta.url).href;

interface BearArticleProps {
  bears: Bear[];
  searchQuery: string;
}

export default function BearArticle({
  bears,
  searchQuery,
}: BearArticleProps): ReactElement {
  return (
    <article>
      <h2>
        <HighlightedText text="The trouble with Bears" query={searchQuery} />
      </h2>
      <p>By Evan Wild</p>
      <p>
        <HighlightedText
          text="Tall, lumbering, angry, dangerous. 
                The real live bears of this world are proud, independent 
                creatures, self-serving and always on the hunt for food."
          query={searchQuery}
        />
      </p>
      <h3>
        <HighlightedText text="Types of bear" query={searchQuery} />
      </h3>
      <table>
        <thead>
          <tr>
            <th scope="col">
              <HighlightedText text="Bear Type" query={searchQuery} />
            </th>
            <th scope="col">
              <HighlightedText text="Coat" query={searchQuery} />
            </th>
            <th scope="col">
              <HighlightedText text="Adult size" query={searchQuery} />
            </th>
            <th scope="col">
              <HighlightedText text="Habitat" query={searchQuery} />
            </th>
            <th scope="col">
              <HighlightedText text="Lifespan" query={searchQuery} />
            </th>
            <th scope="col">
              <HighlightedText text="Diet" query={searchQuery} />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <HighlightedText text="Wild" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="Brown or black" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="1.4 to 2.8 meters" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="Woods and forests" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="25 to 28 years" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="Fish, meat, plants" query={searchQuery} />
            </td>
          </tr>
          <tr>
            <td>
              <HighlightedText text="Urban" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="North Face" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="18 to 22" query={searchQuery} />
            </td>
            <td>
              <HighlightedText
                text="Condos and coffee shops"
                query={searchQuery}
              />
            </td>
            <td>
              <HighlightedText text="20 to 32 years" query={searchQuery} />
            </td>
            <td>
              <HighlightedText text="Starbucks, sushi" query={searchQuery} />
            </td>
          </tr>
        </tbody>
      </table>

      <h3>
        <HighlightedText
          text="Habitats and Eating habits"
          query={searchQuery}
        />
      </h3>
      <p>
        <HighlightedText
          text="Wild bears eat a variety of 
                meat, fish, fruit, nuts, and other naturally
                growing ingredients..."
          query={searchQuery}
        />
      </p>
      <img src={wildBearImage} alt="Wild bear in forest" />
      <p>
        <HighlightedText
          text="Urban (gentrified) bears 
                on the other hand have largely abandoned the
                old ways..."
          query={searchQuery}
        />
      </p>
      <img src={urbanBearImage} alt="Urban bear near buildings" />

      <h3>
        <HighlightedText text="Mating rituals" query={searchQuery} />
      </h3>
      <p>
        <HighlightedText
          text="Bears are romantic 
                creatures by nature..."
          query={searchQuery}
        />
      </p>
      <audio controls>
        <source src={bearMp3} type="audio/mp3" />
        <source src={bearOgg} type="audio/ogg" />
        <p>
          <HighlightedText
            text="It looks like your browser 
                    doesn't support HTML5 audio players."
            query={searchQuery}
          />
        </p>
      </audio>

      <aside>
        <h3>
          <HighlightedText text="About the author" query={searchQuery} />
        </h3>
        <p>
          <HighlightedText
            text="Evan Wild is an unemployed 
                plumber from Doncaster..."
            query={searchQuery}
          />
        </p>
      </aside>

      <CommentsSection searchQuery={searchQuery} />
      <BearList bears={bears} searchQuery={searchQuery} />
    </article>
  );
}
