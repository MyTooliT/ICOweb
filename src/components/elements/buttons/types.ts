export const ButtonColors = ['primary', 'secondary', 'tertiary', 'error'];
export type ButtonColor = (typeof ButtonColors)[number];

export interface ButtonProps {
  color?: ButtonColor;
  text?: string;
}
