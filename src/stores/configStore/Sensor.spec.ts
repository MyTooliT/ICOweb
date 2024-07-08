import { describe, expect, it, vi } from 'vitest';
import { Sensor, SensorRange } from './Sensor.ts';

describe('SensorRange', () => {
  it('should set and get physical unit', () => {
    const sensorRange = new SensorRange('°C', -50, 50);
    expect(sensorRange.getPhysicalUnit()).toBe('°C');

    sensorRange.setPhysicalUnit('Pa');
    expect(sensorRange.getPhysicalUnit()).toBe('Pa');
  });

  it('should set and get lower bound', () => {
    const sensorRange = new SensorRange('°C', -50, 50);
    expect(sensorRange.getLowerBound()).toBe(-50);

    sensorRange.setLowerBound(-100);
    expect(sensorRange.getLowerBound()).toBe(-100);
  });

  it('should set and get upper bound', () => {
    const sensorRange = new SensorRange('°C', -50, 50);
    expect(sensorRange.getUpperBound()).toBe(50);

    sensorRange.setUpperBound(100);
    expect(sensorRange.getUpperBound()).toBe(100);
  });

  it('should correctly determine if the range is symmetric', () => {
    const sensorRange = new SensorRange('°C', -50, 50);
    expect(sensorRange.isSymmetric()).toBe(true);

    sensorRange.setLowerBound(-100);
    expect(sensorRange.isSymmetric()).toBe(false);

    sensorRange.setUpperBound(100);
    expect(sensorRange.isSymmetric()).toBe(true);
  });

  it('should return the correct text representation', () => {
    const sensorRange = new SensorRange('°C', -50, 50);
    expect(sensorRange.text()).toBe('+-50°C');

    sensorRange.setLowerBound(-100);
    expect(sensorRange.text()).toBe('-100/50°C');

    sensorRange.setUpperBound(100);
    expect(sensorRange.text()).toBe('+-100°C');
  });
  /* eslint-disable-next-line max-len */
  it('should log error if lower bound is set equal to or greater than upper bound', () => {
    const sensorRange = new SensorRange('°C', -50, 50);
    const consoleErrorSpy = vi.spyOn(console, 'error');

    sensorRange.setLowerBound(100);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'The lower bounds must be lower than the upper bound. ' +
      'This should never be reachable, as the frontend should not allow this.'
    );

    consoleErrorSpy.mockRestore();
  });
  /* eslint-disable-next-line max-len */
  it('should log error if upper bound is set equal to or less than lower bound', () => {
    const sensorRange = new SensorRange('°C', -50, 50);
    const consoleErrorSpy = vi.spyOn(console, 'error');

    sensorRange.setUpperBound(-100);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'The upper bounds must be greater than the lower bound. ' +
      'This should never be reachable, as the frontend should not allow this.'
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('Sensor', () => {
  it('should set and get physical dimension', () => {
    const sensor = new Sensor('Temperature', '°C', -50, 50);
    expect(sensor.getPhysicalDimension()).toBe('Temperature');

    sensor.setPhysicalDimension('Pressure');
    expect(sensor.getPhysicalDimension()).toBe('Pressure');
  });

  it('should correctly return SensorRange instance', () => {
    const sensor = new Sensor('Temperature', '°C', -50, 50);
    const sensorRange = sensor.getSensorRange();
    expect(sensorRange).toBeInstanceOf(SensorRange);
    expect(sensorRange.getPhysicalUnit()).toBe('°C');
    expect(sensorRange.getLowerBound()).toBe(-50);
    expect(sensorRange.getUpperBound()).toBe(50);
  });

  it('should allow manipulation of SensorRange through Sensor instance', () => {
    const sensor = new Sensor('Temperature', '°C', -50, 50);
    const sensorRange = sensor.getSensorRange();

    sensorRange.setPhysicalUnit('Pa');
    expect(sensorRange.getPhysicalUnit()).toBe('Pa');

    sensorRange.setLowerBound(-100);
    expect(sensorRange.getLowerBound()).toBe(-100);

    sensorRange.setUpperBound(100);
    expect(sensorRange.getUpperBound()).toBe(100);
  });

  it('should correctly compute the range type through Sensor instance', () => {
    const sensor = new Sensor('Temperature', '°C', -50, 50);
    expect(sensor.getSensorRange().isSymmetric()).toBe(true);

    sensor.getSensorRange().setLowerBound(-100);
    expect(sensor.getSensorRange().isSymmetric()).toBe(false);
  });
  /* eslint-disable-next-line max-len */
  it('should correctly return the text representation through Sensor instance', () => {
    const sensor = new Sensor('Temperature', '°C', -50, 50);
    expect(sensor.getSensorRange().text()).toBe('+-50°C');

    sensor.getSensorRange().setLowerBound(-100);
    expect(sensor.getSensorRange().text()).toBe('-100/50°C');

    sensor.getSensorRange().setUpperBound(100);
    expect(sensor.getSensorRange().text()).toBe('+-100°C');
  });
});
