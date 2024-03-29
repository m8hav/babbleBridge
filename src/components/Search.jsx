import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useContext, useState } from 'react'
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { OpenSidebarContext } from '../context/OpenSidebarContext';

function Search() {
  const [username, setUsername] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [err, setErr] = useState(false);

  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  const { setOpenSidebar } = useContext(OpenSidebarContext);

  const handleSearch = async (e) => {
    e.preventDefault();

    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    // console.log("handling search");

    try {
      const querySnapshot = await getDocs(q);
      let found = false;
      querySnapshot.forEach((doc) => {
        found = true;
        setSearchedUser(doc.data());
        // console.log("found searched user")
      });
      if (!found) {
        setSearchedUser(null);
        setErr(true);
        // console.log("searched user not found")
      } else {
        setErr(false);
      }
    } catch (err) {
      console.log("Error: " + err);
      setErr(true);
    }
  }

  // const handleKey = e => {
  //   e.code === "Enter" && handleSearch();
  // }

  const handleSelect = async () => {
    // console.log("selected searched user");
    // check whether the group (chats in firestore) exists
    // if not, create new
    const combinedId = currentUser.uid > searchedUser.uid ? searchedUser.uid + currentUser.uid : currentUser.uid + searchedUser.uid;
    // console.log(combinedId);
    try {
      // console.log("in try block")
      const res = await getDoc(doc(db, "chats", combinedId));
      console.log(res);

      if (!res.exists()) {
        // create a chat in chats collection
        await setDoc(doc(db, "chats", combinedId), { messages: [] });

        console.log("set combined name doc in chats")

        // create user chats
        await updateDoc(doc(db, "userChats", currentUser.uid), {
          [combinedId + ".userInfo"]: {
            uid: searchedUser.uid,
            username: searchedUser.username,
            photoURL: searchedUser.photoURL ? searchedUser.photoURL : "",
            language: searchedUser.language ? searchedUser.language : "en"
          },
          [combinedId + ".date"]: serverTimestamp()
        })
        await updateDoc(doc(db, "userChats", searchedUser.uid), {
          [combinedId + ".userInfo"]: {
            uid: currentUser.uid,
            username: currentUser.displayName,
            photoURL: currentUser.photoURL ? currentUser.photoURL : "",
            language: currentUser.language ? currentUser.language : "en"
          },
          [combinedId + ".date"]: serverTimestamp()
        })
        console.log("created new chats for both users");
      }
    } catch (error) {
      console.log("Error: " + error);
      setErr(true);
    }
    dispatch({
      type: "CHANGE_USER",
      payload: searchedUser
    })
    setSearchedUser(null);
    setUsername("");
    setOpenSidebar(false);
  }


  return (
    <div className='search'>
      <form className="searchForm" onSubmit={handleSearch}>
        <input type="text"
          placeholder='Search for users...'
          // onKeyDown={handleKey}
          onChange={e => setUsername(e.target.value)}
          value={username}
        />
      </form>
      {err && <p className='errorText'>User not found!</p>}
      {searchedUser && <div className="userChat" onClick={handleSelect}>
        {/* <img src={user.photoURL} alt="" /> */}
            {
              searchedUser.photoURL
                ? <img src={searchedUser.photoURL} alt="" />
                : <i className="fa-solid fa-user"></i>
            }
        <div className="userChatInfo">
          <span>{searchedUser.username}</span>
        </div>
      </div>}
    </div>
  )
}

export default Search