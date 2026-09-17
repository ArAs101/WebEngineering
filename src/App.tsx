import type { ReactElement } from 'react';
const wildBearImage = new URL('./media/wild-bear.jpg', import.meta.url).href;
const urbanBearImage = new URL('./media/urban-bear.jpg', import.meta.url).href;
const bearMp3 = new URL('./media/bear.mp3', import.meta.url).href;
const bearOgg = new URL('./media/bear.ogg', import.meta.url).href;

export default function App(): ReactElement {
  return (
    <>
      {/* BEGIN:
        Beautiful HTML markup */}

      <header className="header">
        <h1>Welcome to our wildlife website</h1>
      </header>

      <nav className="nav">
        <ul>
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">Our team</a>
          </li>
          <li>
            <a href="#">Projects</a>
          </li>
          <li>
            <a href="#">Blog</a>
          </li>
        </ul>

        <form className="search">
          <input type="search" name="q" placeholder="Search query" />
          <input type="submit" value="Go!" />
        </form>
      </nav>

      <main>
        <article>
          <h2>The trouble with Bears</h2>
          <p>By Evan Wild</p>
          <p>
            Tall, lumbering, angry, dangerous. The real live bears of this world
            are proud, independent creatures, self-serving and always on the
            hunt for food.
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
            Wild bears eat a variety of meat, fish, fruit, nuts, and other
            natually growing ingredients...
          </p>
          <img src={wildBearImage} alt="Wild bear in forest" />
          <p>
            Urban (gentrified) bears on the other hand have largely abandoned
            the old ways...
          </p>
          <img src={urbanBearImage} alt="Urban bear near buildings" />

          <h3>Mating rituals</h3>
          <p>Bears are romantic creatures by nature...</p>
          <audio controls>
            <source src={bearMp3} type="audio/mp3" />
            <source src={bearOgg} type="audio/ogg" />
            <p>
              It looks like your browser doesn't support HTML5 audio players.
            </p>
          </audio>

          <aside>
            <h3>About the author</h3>
            <p>Evan Wild is an unemployed plumber from Doncaster...</p>
          </aside>

          <section className="comments">
            <button
              className="comments-toggle"
              type="button"
              aria-controls="comments-content"
              aria-expanded="false"
            >
              Show comments
            </button>
            <div className="comment-wrapper" id="comments-content" hidden>
              <h3>Add comment</h3>
              <form className="comment-form">
                <div className="flex-pair">
                  <label htmlFor="name">Your name:</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="flex-pair">
                  <label htmlFor="comment">Your comment:</label>
                  <input
                    type="text"
                    name="comment"
                    id="comment"
                    placeholder="Enter your comment"
                    required
                  />
                </div>
                <div>
                  <input type="submit" value="Submit comment" />
                </div>
              </form>

              <h3>Comments</h3>
              <ul className="comment-container">
                <li>
                  <p>Bob Fossil</p>
                  <p>
                    Oh I am so glad you taught me all about the big brown angry
                    guys...
                  </p>
                </li>
              </ul>
            </div>
          </section>

          <section className="more-bears">
            <h3>More Bears</h3>
            <div className="bear-list"></div>
          </section>
        </article>

        <aside className="secondary">
          <h2>Related</h2>
          <ul>
            <li>
              <a href="#">The trouble with Bees</a>
            </li>
            <li>
              <a href="#">The trouble with Otters</a>
            </li>
            <li>
              <a href="#">The trouble with Penguins</a>
            </li>
            <li>
              <a href="#">The trouble with Octopi</a>
            </li>
            <li>
              <a href="#">The trouble with Lemurs</a>
            </li>
          </ul>
        </aside>
      </main>

      <footer>
        <p>©Copyright 2050 by nobody. All rights reversed.</p>
      </footer>
      {/* END:
        Beautiful HTML markup */}
    </>
  );
}
