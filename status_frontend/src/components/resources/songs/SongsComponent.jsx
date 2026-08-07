/**
 * Functionality: Song List component for Resources page for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/components/resources/songs/SongsComponent.jsx
 * @author Aidan Sanderson
 * @date 8/6/2026
 */
import React, { useState, useEffect } from 'react';
import './SongsComponent.css';
import rawSongList from './songs.txt?raw'; // The song list

/**
 * Song List component for Resource page
 */
export default function SongsComponent() {

  const [songs, setSongs] = useState([]);

  /**
   * builds the list of songs from the raw song list text file and sets them for the useState variable.
   */
  function buildSongList() {
    const splitSongList = rawSongList.split('\n'); // Seperates songs
    const cleanSongList = splitSongList.map(item => item.trim().split('.')); // splits each song by a . character
    const songsToDisplay = [];
    for (const part of cleanSongList) {
      const song = {title: part[1], id: part[0]}; // places the song title with its ID
      songsToDisplay.push(song);
    }
    setSongs(songsToDisplay);
  }

  /**
   * Loads the song list on the page load.
   */
  useEffect( () => {
    buildSongList();
  }, []);

    /**
    * Copies a clicken song id to the users clipboard.
    * 
    * @param {Number} song_id: The ID of the song to copy.
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
