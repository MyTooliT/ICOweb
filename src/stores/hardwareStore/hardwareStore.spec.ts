import {
  createPinia,
  setActivePinia
} from 'pinia';
import {
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';
import { useHardwareStore } from './hardwareStore';
import { Sensor } from './classes/Sensor.ts';
import { STHDevice } from '@/stores/hardwareStore/classes/STHDevice.ts';
import { consumeNewMetadata } from '@/stores/hardwareStore/helper.ts';
import { STHDeviceResponseModel } from '@/client';

describe('hardwareStore Sensor', () => {
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

describe('hardwareStore STHDeviceList', async () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  it('initializes with an empty STH device list', async () => {
    const store = useHardwareStore();
    expect(store.getSTHDeviceList.length).toBe(0)
  })
  // Note:  Since the store function 'updateSTHDeviceList' requests new data
  //        from the REST API, we have side effects. This is why we do not test
  //        the function itself, but the helper.
  //        Bad form, I know. I am trying my best. :^)
  it('helper properly consumes new metadata', () => {
    const currentList: Array<STHDevice> = [
      new STHDevice(
        1,
        'STH 1',
        'AA:BB:CC:DD:EE:FF',
        0
      ),
      new STHDevice(
        2,
        'Messerkopf',
        'AA:BB:CC:DD:EE:EE',
        -44
      ),
    ]
    const newList: Array<STHDeviceResponseModel> = [
      {
        device_number: 1,
        name: 'STH 1',
        mac_address: 'AA:BB:CC:DD:EE:FF',
        rssi: 0
      },
      {
        device_number: 3,
        name: 'Mini Mill',
        mac_address: 'AA:BB:CC:DD:EE:DD',
        rssi: -24
      }
    ]
    expect(consumeNewMetadata(currentList, newList).map(entry => {
      return entry.getDeviceNumber()
    })).toStrictEqual([1, 3])

  })



})
