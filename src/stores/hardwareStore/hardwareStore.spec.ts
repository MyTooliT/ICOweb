import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHardwareStore } from './hardwareStore';
import { Sensor } from './classes/Sensor.ts';

describe('hardwareStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with an empty sensor list', () => {
    const store = useHardwareStore();
    expect(store.getSensorList).toEqual([]);
  });

  it('adds a sensor to the list', () => {
    const store = useHardwareStore();
    const sensor = new Sensor('Temperature', '°C', -50, 50);
    store.addSensor(sensor);
    expect(store.getSensorList.indexOf(sensor)).toBe(0);
  });

  it('clears the sensor list', () => {
    const store = useHardwareStore();
    const sensor = new Sensor('Temperature', '°C', -50, 50);
    store.addSensor(sensor);
    store.clearSensorList();
    expect(store.getSensorList).toEqual([]);
  });

  it('removes a sensor from the list', () => {
    const store = useHardwareStore();
    const sensor1 = new Sensor('Temperature', '°C', -50, 50);
    const sensor2 = new Sensor('Pressure', 'Pa', 0, 100);
    store.addSensor(sensor1);
    store.addSensor(sensor2);
    store.removeSensor(sensor1);
    expect(store.getSensorList.indexOf(sensor1)).toBe(-1)
    expect(store.getSensorList.indexOf(sensor2)).not.toBe(-1)
  });

  it('does not remove a sensor that is not in the list', () => {
    const store = useHardwareStore();
    const sensor1 = new Sensor('Temperature', '°C', -50, 50);
    const sensor2 = new Sensor('Pressure', 'Pa', 0, 100);
    store.addSensor(sensor1);
    store.removeSensor(sensor2);
    expect(store.getSensorList.indexOf(sensor1)).not.toBe(-1)
    expect(store.getSensorList.indexOf(sensor2)).toBe(-1)
  });
});
