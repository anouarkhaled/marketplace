import { useContext } from "react";
import { CarnetContext } from "../context/contexts";
export default function useCarnet() { return useContext(CarnetContext); }
