import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaBatteryFull, FaBatteryHalf, FaBatteryQuarter, FaExclamationTriangle, FaSave } from 'react-icons/fa';

const DelDroneManagement = () => {
    const [drones, setDrones] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingDroneId, setEditingDroneId] = useState(null);

    const [form, setForm] = useState({
        droneId: '',
        batteryLevel: 100,
        status: 'AVAILABLE'
    });

    const fetchDrones = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/drones`);
            setDrones(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchDrones();
    }, []);

    const resetForm = () => {
        setForm({
            droneId: '',
            batteryLevel: 100,
            status: 'AVAILABLE'
        });
        setIsEditing(false);
        setEditingDroneId(null);
        setShowModal(false);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (drone) => {
        setForm({
            droneId: drone.droneId,
            batteryLevel: drone.batteryLevel,
            status: drone.status
        });
        setIsEditing(true);
        setEditingDroneId(drone._id);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const droneData = {
                droneId: form.droneId,
                batteryLevel: parseFloat(form.batteryLevel),
                status: form.status
            };

            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/drones/${editingDroneId}`, droneData);
                alert('✅ Drone updated successfully!');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/drones`, droneData);
                alert('✅ Drone added successfully!');
            }

            resetForm();
            fetchDrones();
        } catch (err) {
            console.error(err);
            alert(isEditing ? '❌ Error updating drone' : '❌ Error adding drone. Drone ID may already exist.');
        }
    };

    const handleDeleteDrone = async (id, droneId) => {
        if (!window.confirm(`⚠️ Are you sure you want to delete drone ${droneId}?`)) {
            return;
        }

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/drones/${id}`);
            alert('🗑️ Drone deleted successfully!');
            fetchDrones();
        } catch (err) {
            console.error(err);
            alert('❌ Error deleting drone');
        }
    };

    return (
        <div className="bg-gray-100 ml-60 mt-[78px] min-h-screen pt-4 w-full font-poppins">
            <div className="w-full max-w-6xl mx-auto p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-4xl">🚁</span> Drone Management
                    </h2>
                    <button
                        onClick={openAddModal}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-md flex items-center gap-2"
                    >
                        <FaPlus /> Add New Drone
                    </button>
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                            <div className="bg-purple-600 text-white p-6 rounded-t-lg">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    {isEditing ? <><FaEdit /> Edit Drone</> : <><FaPlus /> Add New Drone</>}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Drone ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., DRONE-001"
                                        value={form.droneId}
                                        onChange={e => setForm({ ...form, droneId: e.target.value })}
                                        required
                                        disabled={isEditing}
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {isEditing && (
                                        <p className="text-xs text-gray-500 mt-1">Drone ID cannot be changed</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Battery Level (%) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={form.batteryLevel}
                                        onChange={e => setForm({ ...form, batteryLevel: e.target.value })}
                                        min={0}
                                        max={100}
                                        required
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                    >
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="IN_DELIVERY">IN DELIVERY</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                        <option value="OFFLINE">OFFLINE</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        {isEditing ? <><FaSave /> Update Drone</> : <><FaPlus /> Add Drone</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Drones Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drones.length === 0 ? (
                        <div className="col-span-full bg-white p-12 rounded-lg shadow-md text-center">
                            <div className="text-6xl mb-4">🚁</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Drones Yet</h3>
                            <p className="text-gray-500 mb-4">Add your first drone to get started</p>
                            <button
                                onClick={openAddModal}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-all"
                            >
                                <FaPlus /> Add First Drone
                            </button>
                        </div>
                    ) : (
                        drones.map(drone => (
                            <div key={drone._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden">
                                {/* Status Header */}
                                <div className={`p-4 text-white ${
                                    drone.status === 'AVAILABLE' ? 'bg-green-500' :
                                    drone.status === 'IN_DELIVERY' ? 'bg-blue-500' :
                                    drone.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🚁</span>
                                            <div>
                                                <h3 className="font-bold text-xl">{drone.droneId}</h3>
                                                <p className="text-sm opacity-90">{drone.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-3xl">
                                            {drone.batteryLevel >= 70 ? (
                                                <FaBatteryFull className="text-white" />
                                            ) : drone.batteryLevel >= 30 ? (
                                                <FaBatteryHalf className="text-yellow-200" />
                                            ) : (
                                                <FaBatteryQuarter className="text-red-200" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    {/* Battery Level */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600">Battery Level</span>
                                            <span className={`font-bold ${
                                                drone.batteryLevel >= 70 ? 'text-green-600' :
                                                drone.batteryLevel >= 30 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {drone.batteryLevel}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all ${
                                                    drone.batteryLevel >= 70 ? 'bg-green-500' :
                                                    drone.batteryLevel >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${drone.batteryLevel}%` }}
                                            ></div>
                                        </div>
                                        {drone.batteryLevel < 30 && (
                                            <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                                                <FaExclamationTriangle /> Low battery warning!
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="bg-gray-50 px-4 py-3 flex gap-2">
                                    <button
                                        onClick={() => openEditModal(drone)}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDrone(drone._id, drone.droneId)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                                    >
                                        <FaTrash /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DelDroneManagement;

