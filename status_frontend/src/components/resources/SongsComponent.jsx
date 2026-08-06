/**
 * Functionality: Song List component for Resources page for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/components/resources/SongsComponent.jsx
 * @author Aidan Sanderson
 * @date 8/6/2026
 */
import React from 'react';
import './SongsComponent.css';

/**
 * Song List component for Resource page
 */
export default function SongsComponent() {

  const songs = [
    { title: "Song 1", id: "1" },
    { title: "Song 2", id: "2" },
    { title: "Song 3", id: "3" },
    { title: "Song 1", id: "1" },
    { title: "Song 2", id: "2" },
    { title: "Song 3", id: "3" },
    { title: "Song 1", id: "1" },
    { title: "Song 2", id: "2" },
    { title: "Song 3", id: "3" },
    { title: "Song 1", id: "1" },
    { title: "Song 2", id: "2" },
    { title: "Song 3", id: "3" },
    { title: "Song 1", id: "1" },
    { title: "Song 2", id: "2" },
    { title: "Song 3", id: "3" },
    { title: "Song 1", id: "1" },
    { title: "Song 2", id: "2" },
    { title: "Song 3", id: "3" },
    { title: "Song 1", id: "1" },
    { title: "Song 2", id: "2" },
    { title: "Song 3", id: "3" }
  ];

    /**
    * Copies a clicken song id to the users clipboard
    */
    const handleCopyId = async (song_id) => {
        try {
            await navigator.clipboard.writeText(song_id);
            console.log(`Copied Song ID to clipboard with Song ID: ${song_id}`);
        }
        catch(err) {
            console.error(`Failed to copy Song ID to clipboard -> Error: ${err}`);
        }
    }

  return (
    <div className="songs-container">
        <header className="songs-header">
          <h2>RoboFleet Song List</h2>
        </header>

      <div className="songs-scrollable-content">
        <main className="songs-content">
          <section className="songs-list-panel">
            
            {/* STICKY COLUMN HEADERS */} 
            <div className="songs-list-header"> 
                <span className="header-title">Song Name</span> 
                <span className="header-id">ID</span> 
            </div> 

            {/* POPULATED FLEX CONTAINER */}
            <ul className="songs-list">
              {songs.map((song) => (
                <li key={song.id}>
                  <span className="song-title">{song.title}</span>
                    <button 
                        className="song-id-box" 
                        onClick={() => handleCopyId(song.id)}
                        title="Copy ID"
                    >
                    {song.id}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

        {/* FOOTER */}
        <footer className="songs-footer">
            <p className="play-music-section">
                To play a song on a RoboFleet robot, login and run the command Robot().play_music(song_id)
            </p>
        </footer>
    </div>
  );
}
