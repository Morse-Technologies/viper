"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { api, type AlertStatus, type Feedback, type Id, type Range } from "@/lib/api";

/* The plant in scope, remembered per browser. The group hub ignores it. */
const PLANT_KEY = "viper-plant";
const PLANT_EVENT = "viper-plant";
export const DEFAULT_PLANT = "pl-north";
const readPlant = () => { try { return localStorage.getItem(PLANT_KEY) ?? DEFAULT_PLANT; } catch { return DEFAULT_PLANT; } };
const subscribePlant = (cb: () => void) => { window.addEventListener(PLANT_EVENT, cb); return () => window.removeEventListener(PLANT_EVENT, cb); };

export function usePlantId() {
  const plantId = useSyncExternalStore(subscribePlant, readPlant, () => DEFAULT_PLANT);
  const setPlantId = useCallback((id: Id) => {
    try { localStorage.setItem(PLANT_KEY, id); } catch {}
    window.dispatchEvent(new Event(PLANT_EVENT));
  }, []);
  return { plantId, setPlantId };
}

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: api.me });
export const usePlants = () => useQuery({ queryKey: ["plants"], queryFn: api.plants });

export function usePlant() {
  const { plantId } = usePlantId();
  const { data } = usePlants();
  return data?.find((p) => p.id === plantId);
}

export function useOverview() {
  const { plantId } = usePlantId();
  return useQuery({ queryKey: ["overview", plantId], queryFn: () => api.overview(plantId) });
}

export function useMachines(scope: "plant" | "group" = "plant") {
  const { plantId } = usePlantId();
  const id = scope === "plant" ? plantId : undefined;
  return useQuery({ queryKey: ["machines", id ?? "all"], queryFn: () => api.machines(id) });
}

export const useMachine = (id: Id | null) =>
  useQuery({ queryKey: ["machine", id], queryFn: () => api.machine(id!), enabled: !!id });

export const useSignals = (machineId: Id | null) =>
  useQuery({ queryKey: ["signals", machineId], queryFn: () => api.signals(machineId!), enabled: !!machineId });

export function usePlantSignals() {
  const { plantId } = usePlantId();
  return useQuery({ queryKey: ["signals-plant", plantId], queryFn: () => api.allSignals(plantId) });
}

export const useSeries = (signalId: Id | null, range: Range) =>
  useQuery({ queryKey: ["series", signalId, range], queryFn: () => api.series(signalId!, range), enabled: !!signalId });

export function useAlerts(scope: "plant" | "group" = "plant") {
  const { plantId } = usePlantId();
  const id = scope === "plant" ? plantId : undefined;
  return useQuery({ queryKey: ["alerts", id ?? "all"], queryFn: () => api.alerts(id) });
}

export const useAlert = (id: Id | null) =>
  useQuery({ queryKey: ["alert", id], queryFn: () => api.alert(id!), enabled: !!id });

/** Status and feedback writes refresh every alert view (lists, counters, overview). */
function useAlertWrite<V>(write: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => Promise.all(["alerts", "alert", "overview", "plants"].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
}
export const useSetAlertStatus = () => useAlertWrite((v: { id: Id; status: AlertStatus }) => api.setAlertStatus(v.id, v.status));
export const useSendFeedback = () => useAlertWrite((v: { id: Id; feedback: Feedback }) => api.sendFeedback(v.id, v.feedback));

export const useChannels = (machineId: Id | null) =>
  useQuery({ queryKey: ["channels", machineId], queryFn: () => api.channels(machineId!), enabled: !!machineId });
export const useSpectrum = (channelId: Id | null) =>
  useQuery({ queryKey: ["spectrum", channelId], queryFn: () => api.spectrum(channelId!), enabled: !!channelId });
export const useSpectrogram = (channelId: Id | null) =>
  useQuery({ queryKey: ["spectrogram", channelId], queryFn: () => api.spectrogram(channelId!), enabled: !!channelId });
export const useSnippets = (channelId: Id | null) =>
  useQuery({ queryKey: ["snippets", channelId], queryFn: () => api.snippets(channelId!), enabled: !!channelId });

/** Plant-scoped lists share one shape: the key names the resource, the plant completes it. */
function usePlantQuery<T>(key: string, fetch: (plantId: Id) => Promise<T>) {
  const { plantId } = usePlantId();
  return useQuery({ queryKey: [key, plantId], queryFn: () => fetch(plantId) });
}
export const useCameras = () => usePlantQuery("cameras", api.cameras);
export const useModels = () => usePlantQuery("models", api.models);
export const useLabelTasks = () => usePlantQuery("label-tasks", api.labelTasks);
export const useSources = () => usePlantQuery("sources", api.sources);
export const useEdgeDevices = () => usePlantQuery("edge", api.edgeDevices);
export const useThresholds = () => usePlantQuery("thresholds", api.thresholds);

export const useAllModels = () => useQuery({ queryKey: ["models", "all"], queryFn: () => api.models() });
export const useTaxonomy = () => useQuery({ queryKey: ["taxonomy"], queryFn: api.taxonomy });
export const useDrivers = () => useQuery({ queryKey: ["drivers"], queryFn: api.drivers });
export const useUsers = () => useQuery({ queryKey: ["users"], queryFn: api.users });
export const useLicense = () => useQuery({ queryKey: ["license"], queryFn: api.license });

export function useCompleteLabelTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: Id; classId: Id | null }) => api.completeLabelTask(v.id, v.classId),
    onSuccess: () => Promise.all(["label-tasks", "overview"].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
}
