import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import dp from '../assets/dp.webp'; // Default profile picture

function ForwardMessageModal({ message, onClose, onForward }) {
    const { otherUsers } = useSelector(state => state.user);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = otherUsers?.filter(user =>
        user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleRecipientSelect = (userId) => {
        setSelectedRecipients(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleConfirmForward = () => {
        if (selectedRecipients.length > 0) {
            onForward(message, selectedRecipients);
        } else {
            alert('Please select at least one recipient.');
        }
    };

    if (!message) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl relative"
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 50 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                >
                    <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl">
                        <IoClose />
                    </button>

                    <h2 className="text-2xl font-bold text-white mb-4">Forward Message</h2>

                    <div className="mb-4 text-gray-300">
                        <p className="font-semibold text-lg mb-2">Message Content:</p>
                        {message.message && (
                            <p className="text-base break-words max-h-20 overflow-y-auto">
                                {message.message}
                            </p>
                        )}
                        {message.image && (
                            <img
                                src={message.image}
                                alt="Forwarded"
                                className="max-w-xs max-h-32 object-contain my-2 rounded-md"
                            />
                        )}
                        {message.audio && (
                            <audio controls src={message.audio} className="w-full my-2">
                                <source src={message.audio} type="audio/mpeg" />
                            </audio>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="max-h-60 overflow-y-auto mb-4 custom-scrollbar pr-2">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 transition-colors duration-200 ${
                                        selectedRecipients.includes(user._id)
                                            ? 'bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                    onClick={() => handleRecipientSelect(user._id)}
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                                        <img
                                            src={user.image || dp}
                                            alt="dp"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-white font-medium flex-1">{user.name}</span>
                                    {selectedRecipients.includes(user._id) && (
                                        <span className="text-white text-lg">✓</span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center">No users found.</p>
                        )}
                    </div>

                    <button
                        onClick={handleConfirmForward}
                        disabled={selectedRecipients.length === 0}
                        className={`w-full py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
                            selectedRecipients.length > 0
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Forward ({selectedRecipients.length})
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ForwardMessageModal;
