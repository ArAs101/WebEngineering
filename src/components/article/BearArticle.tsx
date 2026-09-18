import type { ReactElement } from 'react';
import type { Bear } from '../../scripts/types';
import CommentsSection from '../comments/CommentsSection';
import BearList from '../bears/BearList';

const wildBearImage = new URL('../../media/wild-bear.jpg', import.meta.url)
  .href;

const urbanBearImage = new URL('../../media/urban-bear.jpg', import.meta.url)
  .href;

const bearMp3 = new URL('../../media/bear.mp3', import.meta.url).href;
const bearOgg = new URL('../../media/bear.ogg', import.meta.url).href;

interface BearArticleProps {
  bears: Bear[];
}

export default function BearArticle({ bears }: BearArticleProps): ReactElement {
  return (
    <article>
      <h2>The trouble with Bears</h2>
      <p>By Evan Wild</p>
      <p>
        Tall, lumbering, angry, dangerous. The real live bears of this world are
        proud, independent creatures, self-serving and always on the hunt for
        food.
      </p>
      <h3>Types of bear</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Bear Type</th>
            <th scope="col">Coat</th>
            <th scope="col">Adult size</th>
            <th scope="col">Habitat</th>
            <th scope="col">Lifespan</th>
            <th scope="col">Diet</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Wild</td>
            <td>Brown or black</td>
            <td>1.4 to 2.8 meters</td>
            <td>Woods and forests</td>
            <td>25 to 28 years</td>
            <td>Fish, meat, plants</td>
          </tr>
          <tr>
            <td>Urban</td>
            <td>North Face</td>
            <td>18 to 22</td>
            <td>Condos and coffee shops</td>
            <td>20 to 32 years</td>
            <td>Starbucks, sushi</td>
          </tr>
        </tbody>
      </table>

      <h3>Habitats and Eating habits</h3>
      <p>
        Wild bears eat a variety of meat, fish, fruit, nuts, and other natually
        growing ingredients...
      </p>
      <img src={wildBearImage} alt="Wild bear in forest" />
      <p>
        Urban (gentrified) bears on the other hand have largely abandoned the
        old ways...
      </p>
      <img src={urbanBearImage} alt="Urban bear near buildings" />

      <h3>Mating rituals</h3>
      <p>Bears are romantic creatures by nature...</p>
      <audio controls>
        <source src={bearMp3} type="audio/mp3" />
        <source src={bearOgg} type="audio/ogg" />
        <p>It looks like your browser doesn't support HTML5 audio players.</p>
      </audio>

      <aside>
        <h3>About the author</h3>
        <p>Evan Wild is an unemployed plumber from Doncaster...</p>
      </aside>

      <CommentsSection />
      <BearList bears={bears} />
    </article>
  );
}
