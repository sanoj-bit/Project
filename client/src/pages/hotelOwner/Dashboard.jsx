import React, { useState, useEffect } from 'react'
import Title from '../../components/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Dashboard = () => {

  const { currency, user, getToken, axios } = useAppContext();

  const [dashboardData, setDashboardData] = useState({
    bookings: [],
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get('/api/bookings/hotel', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) return;

    try {
      const { data } = await axios.post('/api/bookings/cancel', { bookingId }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        toast.success(data.message);
        setDashboardData((prev) => ({
          ...prev,
          bookings: prev.bookings.map((b) =>
            b._id === bookingId ? { ...b, status: 'cancelled' } : b
          )
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteBooking = async (bookingId) => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this booking? This cannot be undone.");
    if (!confirmed) return;

    try {
      const { data } = await axios.post('/api/bookings/delete', { bookingId }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        toast.success(data.message);
        setDashboardData((prev) => ({
          ...prev,
          bookings: prev.bookings.filter((b) => b._id !== bookingId)
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatusStyle = (item) => {
    if (item.status === 'cancelled') return 'bg-red-200 text-red-600';
    if (item.isPaid) return 'bg-green-200 text-green-600';
    return 'bg-amber-200 text-yellow-600';
  };

  const getStatusLabel = (item) => {
    if (item.status === 'cancelled') return 'Cancelled';
    if (item.isPaid) return 'Completed';
    return 'Pending';
  };

  return (
    <div>
      <Title
        align='left'
        font='outfit'
        title='Dashboard'
        subTitle='Monitor your room listings, track bookings and analyze revenue—all in one place. Stay updated with real-time insights to ensure smooth operations.'
      />

      <div className='flex gap-4 my-8'>
        {/* ---- Total Bookings ---- */}
        <div className='bg-primary/3 border border-primary/10 rounded flex p-4 pr-8'>
          <img src={assets.totalBookingIcon} alt="" className='max-sm:hidden h-10' />
          <div className='flex flex-col sm:ml-4 font-medium'>
            <p className='text-blue-500 text-lg'>Total Bookings</p>
            <p className='text-neutral-400 text-base'>{dashboardData.totalBookings}</p>
          </div>
        </div>

        {/* ---- Total Revenue ---- */}
        <div className='bg-primary/3 border border-primary/10 rounded flex p-4 pr-8'>
          <img src={assets.totalRevenueIcon} alt="" className='max-sm:hidden h-10' />
          <div className='flex flex-col sm:ml-4 font-medium'>
            <p className='text-blue-500 text-lg'>Total Revenue</p>
            <p className='text-neutral-400 text-base'>{currency} {dashboardData.totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* ---- Recent Bookings ---- */}
      <h2 className='text-xl text-blue-950/70 font-medium mb-5'>Recent Bookings</h2>

      {loading ? (
        <div className='flex items-center gap-2 text-gray-500'>
          <div className='w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin'></div>
          Loading bookings...
        </div>
      ) : dashboardData.bookings.length === 0 ? (
        <p className='text-gray-500'>No bookings yet. Once guests start booking your rooms, they'll show up here.</p>
      ) : (
      <div className='w-full max-w-3xl text-left border border-gray-300 rounded-lg max-h-80 overflow-y-scroll'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='py-3 px-4 text-gray-800 font-medium'>User Name</th>
              <th className='py-3 px-4 text-gray-800 font-medium max-sm:hidden'>Room Name</th>
              <th className='py-3 px-4 text-gray-800 font-medium text-center'>Total Amount</th>
              <th className='py-3 px-4 text-gray-800 font-medium text-center'>Status</th>
              <th className='py-3 px-4 text-gray-800 font-medium text-center'>Action</th>
            </tr>
          </thead>

          <tbody className='text-sm'>
            {dashboardData.bookings.map((item, index) => (
              <tr key={index}>
                <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>
                  {item.user?.username || 'Unknown user'}
                </td>

                <td className='py-3 px-4 text-gray-700 border-t border-gray-300 max-sm:hidden'>
                  {item.room?.roomType || 'Room no longer available'}
                </td>

                <td className='py-3 px-4 text-gray-700 border-t border-gray-300 text-center'>
                  {currency} {item.totalPrice}
                </td>

                <td className='py-3 px-4 border-t border-gray-300 text-center'>
                  <span className={`py-1 px-3 text-xs rounded-full ${getStatusStyle(item)}`}>
                    {getStatusLabel(item)}
                  </span>
                </td>

                <td className='py-3 px-4 border-t border-gray-300 text-center'>
                  {item.status !== 'cancelled' ? (
                    <button
                      onClick={() => cancelBooking(item._id)}
                      className='text-red-500 hover:text-red-700 text-xs font-medium border border-red-300 rounded px-3 py-1.5 hover:bg-red-50 transition-all cursor-pointer'
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteBooking(item._id)}
                      className='text-gray-500 hover:text-gray-700 text-xs font-medium border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-all cursor-pointer'
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default Dashboard;