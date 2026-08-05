import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/react";
import { toast } from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isOwner, setIsOwner] = useState(false);
  const [isOwnerLoading, setIsOwnerLoading] = useState(true);
  const [ShowHotelReg, setShowHotelReg] = useState(false);
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('/api/rooms');
      if (data.success) {
        setRooms(data.rooms);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      setIsOwnerLoading(true);

      if (!user) {
        setIsOwner(false);
        setSearchedCities([]);
        setIsOwnerLoading(false);
        return;
      }

      const { data } = await axios.get('/api/user', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setIsOwner(data.role === "hotelOwner");
        setSearchedCities(data.recentSearchedCities || []);
      } else {
        setIsOwner(false);
        setSearchedCities([]);
        // Retry fetching User Details after 5 seconds
        setTimeout(() => {
          fetchUser();
        }, 5000);
      }
    } catch (error) {
      setIsOwner(false);
      setSearchedCities([]);
      toast.error(error.message);
    } finally {
      setIsOwnerLoading(false);
    }
  };

  useEffect(() => {
    setIsOwner(false);
    setIsOwnerLoading(true);

    if (!user) {
      setIsOwner(false);
      setSearchedCities([]);
      setIsOwnerLoading(false);
      return;
    }

    fetchUser();
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const value = {
    currency, navigate, user, getToken, isOwner, isOwnerLoading, setIsOwner, fetchUser, axios,
    ShowHotelReg, setShowHotelReg, searchedCities,
    setSearchedCities, rooms, setRooms, roomsLoading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);