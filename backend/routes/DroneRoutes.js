import express from "express";
import DroneModel from "../models/DroneModel.js";
import { metrics } from '../middleware/prometheus.middleware.js';

const router = express.Router();

// Create a new drone
router.post("/", async (req, res) => {
    try {
        const drone = new DroneModel(req.body);
        await drone.save();

        // Send response first to avoid blocking the request
        res.status(201).json(drone);

        // ✅ Track metric: New drone added to fleet (in background)
        setImmediate(async () => {
            try {
                const activeDronesCount = await DroneModel.countDocuments({ status: 'AVAILABLE' });
                if (metrics && typeof metrics.setActiveDrones === "function") {
                    metrics.setActiveDrones(activeDronesCount);
                }
            } catch (err) {
                // Silently ignore metric errors to not affect the main flow
                console.error('Error updating drone metrics:', err.message);
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all drones
router.get("/", async (req, res) => {
    try {
        const drones = await DroneModel.find();
        res.json(drones);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single drone by ID
router.get("/:id", async (req, res) => {
    try {
        const drone = await DroneModel.findById(req.params.id);
        if (!drone) return res.status(404).json({ error: "Drone not found" });
        res.json(drone);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a drone
router.put("/:id", async (req, res) => {
    try {
        const drone = await DroneModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!drone) return res.status(404).json({ error: "Drone not found" });
        res.json(drone);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a drone
router.delete("/:id", async (req, res) => {
    try {
        const drone = await DroneModel.findByIdAndDelete(req.params.id);
        if (!drone) return res.status(404).json({ error: "Drone not found" });

        // Send response first to avoid blocking the request
        res.json({ message: "Drone deleted" });

        // ✅ Track metric: Update active drones count after deletion (in background)
        setImmediate(async () => {
            try {
                const activeDronesCount = await DroneModel.countDocuments({ status: 'AVAILABLE' });
                if (metrics && typeof metrics.setActiveDrones === "function") {
                    metrics.setActiveDrones(activeDronesCount);
                }
            } catch (err) {
                // Silently ignore metric errors to not affect the main flow
                console.error('Error updating drone metrics:', err.message);
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update drone status
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const drone = await DroneModel.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!drone) return res.status(404).json({ error: "Drone not found" });

        // Send response first to avoid blocking the request
        res.json(drone);

        // ✅ Track metric: Update active drones count (in background)
        setImmediate(async () => {
            try {
                const activeDronesCount = await DroneModel.countDocuments({ status: 'AVAILABLE' });
                if (metrics && typeof metrics.setActiveDrones === "function") {
                    metrics.setActiveDrones(activeDronesCount);
                }
            } catch (err) {
                // Silently ignore metric errors to not affect the main flow
                console.error('Error updating drone metrics:', err.message);
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
