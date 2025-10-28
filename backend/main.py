import os
import logging
from enum import Enum
from pathlib import Path as FilePath
from typing import List, Dict, Any

import fastf1
import fastf1.ergast as ergast
import pandas as pd
import numpy as np
from fastapi import FastAPI, Request, Path
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic_settings import BaseSettings, SettingsConfigDict

from fastf1.core import Session


# --- 1. Centralized Configuration Management ---
class Settings(BaseSettings):
    """Application settings with environment variable support"""
    CORS_ORIGINS: List[str] = ["*"]
    CACHE_DIR: str = "f1_cache"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()


# --- 2. Structured Logging ---
logging.basicConfig(
    level=settings.LOG_LEVEL.upper(),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# --- 3. Application Initialization ---
FilePath(settings.CACHE_DIR).mkdir(parents=True, exist_ok=True)

try:
    fastf1.Cache.enable_cache(settings.CACHE_DIR)
    logger.info(f"FastF1 cache enabled at: {settings.CACHE_DIR}")
except Exception as e:
    logger.error(f"Failed to enable FastF1 cache: {e}", exc_info=True)

# Configure FastF1 to use jolpica-f1 API (replacement for deprecated Ergast)
fastf1.ergast.interface.BASE_URL = "https://api.jolpi.ca/ergast/f1"
logger.info("Configured FastF1 to use jolpica-f1 API")

app = FastAPI(
    title="FastF1 API (Production Ready)",
    description="An improved, production-ready API to access Formula 1 data using the FastF1 library with jolpica-f1 backend.",
    version="2.2.0",
)


# --- Initialize Ergast client ---
ergast_client = ergast.Ergast()


# --- 4. Secure CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


# --- 5. Robust Input Validation (Enums) ---
class SessionIdentifier(str, Enum):
    FP1 = "FP1"
    FP2 = "FP2"
    FP3 = "FP3"
    SQ = "SQ"  # Sprint Qualifying
    S = "S"    # Sprint
    Q = "Q"
    R = "R"


# --- 6. Centralized Error Handling ---
@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    logger.error(f"Data not found for request {request.url}: {exc}")
    return JSONResponse(
        status_code=404,
        content={"detail": f"The requested data could not be found. Reason: {str(exc)}"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error for request {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# --- 7. Helper function to safely convert DataFrame to JSON ---
def to_json_serializable(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Converts a Pandas DataFrame to a JSON-serializable list of dictionaries.
    - Replaces numpy.nan with None (which becomes null in JSON).
    - Converts timedelta objects to ISO format strings.
    - Handles Timestamp objects properly.
    """
    if df is None or df.empty:
        return []
    
    # Create a copy to avoid modifying the original DataFrame
    df_copy = df.copy()

    # Convert timedelta columns to string representation (ISO 8601 format)
    for col in df_copy.select_dtypes(include=['timedelta64[ns]']).columns:
        df_copy[col] = df_copy[col].apply(
            lambda x: None if pd.isna(x) else str(x)
        )
    
    # Convert Timestamp columns to ISO format strings
    for col in df_copy.select_dtypes(include=['datetime64[ns, UTC]', 'datetime64[ns]']).columns:
        df_copy[col] = df_copy[col].apply(
            lambda x: None if pd.isna(x) else x.isoformat()
        )

    # Replace all NaN values with None
    df_copy = df_copy.replace({np.nan: None, pd.NaT: None})
    
    # Convert to dict
    return df_copy.to_dict(orient='records')


# --- Helper function for loading session data ---
async def load_session(
    year: int, gp: str, session_identifier: str,
    load_laps: bool = False, load_telemetry: bool = False,
    load_weather: bool = False, load_messages: bool = False
) -> Session:
    """
    Load a FastF1 session with specified data.
    
    Args:
        year: Season year
        gp: Grand Prix name or round number
        session_identifier: Session type (FP1, FP2, FP3, Q, S, SQ, R)
        load_laps: Load lap data
        load_telemetry: Load telemetry data
        load_weather: Load weather data
        load_messages: Load race control messages
        
    Returns:
        Loaded Session object
        
    Raises:
        ValueError: If session data is not available
    """
    try:
        session = await run_in_threadpool(fastf1.get_session, year, gp, session_identifier)
        await run_in_threadpool(
            session.load,
            laps=load_laps, 
            telemetry=load_telemetry,
            weather=load_weather, 
            messages=load_messages
        )
        return session
    except Exception as e:
        logger.error(f"Failed to load session for {year}/{gp}/{session_identifier}: {e}", exc_info=True)
        raise ValueError(f"Session data for {year} {gp} '{session_identifier}' is not available. Error: {str(e)}")


# --- 8. API Endpoints ---
@app.get("/")
async def read_root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to the FastF1 API",
        "documentation": "/docs",
        "version": "2.2.0",
        "data_source": "jolpica-f1 API (Ergast replacement)"
    }


@app.get("/schedule/{year}", response_model=List[Dict[str, Any]])
async def get_schedule(year: int = Path(..., ge=1950, le=2030)):
    """
    Get the complete event schedule for a given F1 season.
    
    Args:
        year: Season year (1950-2030)
        
    Returns:
        List of events with dates, locations, and session information
    """
    try:
        schedule_df = await run_in_threadpool(fastf1.get_event_schedule, year)
        return to_json_serializable(schedule_df)
    except Exception as e:
        logger.error(f"Failed to get schedule for {year}: {e}", exc_info=True)
        raise ValueError(f"Schedule for {year} is not available.")


# --- Standings Endpoints ---
@app.get("/standings/drivers/{year}", response_model=List[Dict[str, Any]])
async def get_driver_standings(year: int = Path(..., ge=1950, le=2030)):
    """
    Gets the World Drivers' Championship standings for a given year.
    
    Args:
        year: Season year (1950-2030)
        
    Returns:
        List of driver standings with positions, points, and wins
    """
    try:
        standings = await run_in_threadpool(ergast_client.get_driver_standings, season=year)
        if not standings.content or len(standings.content) == 0:
            raise ValueError(f"No driver standings found for the {year} season.")
        return to_json_serializable(standings.content[0])
    except Exception as e:
        logger.error(f"Failed to get driver standings for {year}: {e}", exc_info=True)
        raise ValueError(f"Driver standings for {year} are not available. Error: {str(e)}")


@app.get("/standings/constructors/{year}", response_model=List[Dict[str, Any]])
async def get_constructor_standings(year: int = Path(..., ge=1950, le=2030)):
    """
    Gets the Constructors' Championship standings for a given year.
    
    Args:
        year: Season year (1950-2030)
        
    Returns:
        List of constructor standings with positions and points
    """
    try:
        standings = await run_in_threadpool(ergast_client.get_constructor_standings, season=year)
        if not standings.content or len(standings.content) == 0:
            raise ValueError(f"No constructor standings found for the {year} season.")
        return to_json_serializable(standings.content[0])
    except Exception as e:
        logger.error(f"Failed to get constructor standings for {year}: {e}", exc_info=True)
        raise ValueError(f"Constructor standings for {year} are not available. Error: {str(e)}")


# --- Driver and Constructor Information ---
@app.get("/drivers/{year}", response_model=List[Dict[str, Any]])
async def get_all_drivers(year: int = Path(..., ge=1950, le=2030)):
    """
    Gets a list of all drivers for a given season.
    
    Args:
        year: Season year (1950-2030)
        
    Returns:
        List of drivers with their information
    """
    try:
        drivers = await run_in_threadpool(ergast_client.get_drivers, season=year)
        if drivers.empty:
            raise ValueError(f"No drivers found for the {year} season.")
        return to_json_serializable(drivers)
    except Exception as e:
        logger.error(f"Failed to get drivers for {year}: {e}", exc_info=True)
        raise ValueError(f"Drivers list for {year} is not available. Error: {str(e)}")


@app.get("/constructors/{year}", response_model=List[Dict[str, Any]])
async def get_all_constructors(year: int = Path(..., ge=1950, le=2030)):
    """
    Gets a list of all constructor teams for a given season.
    
    Args:
        year: Season year (1950-2030)
        
    Returns:
        List of constructors with their information
    """
    try:
        constructors = await run_in_threadpool(ergast_client.get_constructors, season=year)
        if constructors.empty:
            raise ValueError(f"No constructors found for the {year} season.")
        return to_json_serializable(constructors)
    except Exception as e:
        logger.error(f"Failed to get constructors for {year}: {e}", exc_info=True)
        raise ValueError(f"Constructors list for {year} is not available. Error: {str(e)}")


# --- Session Data Endpoints ---
@app.get("/session/{year}/{gp}/{session_identifier}/results", response_model=List[Dict[str, Any]])
async def get_session_results(
    year: int = Path(..., ge=1950, le=2030),
    gp: str = Path(..., min_length=1),
    session_identifier: SessionIdentifier = Path(...)
):
    """
    Get session results (qualifying/race classification).
    
    Args:
        year: Season year
        gp: Grand Prix name or round number
        session_identifier: Session type (FP1, FP2, FP3, Q, S, SQ, R)
        
    Returns:
        List of results with driver positions, times, and classifications
    """
    session = await load_session(year, gp, session_identifier.value, load_laps=True)
    if session.results is None or session.results.empty:
        raise ValueError("Results data is not available for this session.")
    return to_json_serializable(session.results)


@app.get("/session/{year}/{gp}/{session_identifier}/laps", response_model=List[Dict[str, Any]])
async def get_laps(
    year: int = Path(..., ge=1950, le=2030),
    gp: str = Path(..., min_length=1),
    session_identifier: SessionIdentifier = Path(...)
):
    """
    Get all lap data for a session.
    
    Args:
        year: Season year
        gp: Grand Prix name or round number
        session_identifier: Session type
        
    Returns:
        List of all laps with timing and performance data
    """
    session = await load_session(year, gp, session_identifier.value, load_laps=True)
    if session.laps is None or session.laps.empty:
        raise ValueError("Lap data is not available for this session.")
    return to_json_serializable(session.laps)


@app.get("/session/{year}/{gp}/{session_identifier}/telemetry/{driver}", response_model=List[Dict[str, Any]])
async def get_driver_telemetry(
    year: int = Path(..., ge=2018, le=2030),
    gp: str = Path(..., min_length=1),
    session_identifier: SessionIdentifier = Path(...),
    driver: str = Path(..., min_length=3, max_length=3)
):
    """
    Get telemetry data for a driver's fastest lap.
    
    Args:
        year: Season year (telemetry available from 2018 onwards)
        gp: Grand Prix name or round number
        session_identifier: Session type
        driver: Three-letter driver abbreviation (e.g., VER, HAM, LEC)
        
    Returns:
        Telemetry data including speed, throttle, brake, gear, RPM, and position
    """
    session = await load_session(year, gp, session_identifier.value, load_laps=True, load_telemetry=True)
    
    # Get driver laps
    driver_laps = session.laps.pick_driver(driver)
    if driver_laps.empty:
        raise ValueError(f"No laps found for driver {driver} in this session.")
    
    # Pick fastest lap
    try:
        fastest_lap = driver_laps.pick_fastest()
    except Exception as e:
        logger.error(f"Failed to pick fastest lap for {driver}: {e}")
        raise ValueError(f"No valid fastest lap found for driver {driver}.")
    
    # Check if lap has valid time
    if pd.isna(fastest_lap.get('LapTime')):
        raise ValueError(f"No valid lap time found for driver {driver}.")
    
    # Get telemetry
    try:
        telemetry = await run_in_threadpool(fastest_lap.get_telemetry)
        if telemetry.empty:
            raise ValueError(f"No telemetry data available for driver {driver}.")
        return to_json_serializable(telemetry)
    except Exception as e:
        logger.error(f"Failed to get telemetry for {driver}: {e}", exc_info=True)
        raise ValueError(f"Telemetry data for driver {driver} is not available. Error: {str(e)}")


@app.get("/session/{year}/{gp}/{session_identifier}/weather", response_model=List[Dict[str, Any]])
async def get_weather_data(
    year: int = Path(..., ge=2018, le=2030),
    gp: str = Path(..., min_length=1),
    session_identifier: SessionIdentifier = Path(...)
):
    """
    Get weather data for a session.
    
    Args:
        year: Season year (weather data available from 2018 onwards)
        gp: Grand Prix name or round number
        session_identifier: Session type
        
    Returns:
        Weather data including temperature, humidity, wind, and rainfall
    """
    session = await load_session(year, gp, session_identifier.value, load_weather=True)
    if session.weather_data is None or session.weather_data.empty:
        raise ValueError("Weather data is not available for this session.")
    return to_json_serializable(session.weather_data)


@app.get("/session/{year}/{gp}/{session_identifier}/messages", response_model=List[Dict[str, Any]])
async def get_race_control_messages(
    year: int = Path(..., ge=2018, le=2030),
    gp: str = Path(..., min_length=1),
    session_identifier: SessionIdentifier = Path(...)
):
    """
    Get race control messages for a session.
    
    Args:
        year: Season year (messages available from 2018 onwards)
        gp: Grand Prix name or round number
        session_identifier: Session type
        
    Returns:
        List of race control messages with timestamps and content
    """
    session = await load_session(year, gp, session_identifier.value, load_messages=True)
    if session.race_control_messages is None or session.race_control_messages.empty:
        raise ValueError("Race control messages are not available for this session.")
    return to_json_serializable(session.race_control_messages)


# --- Health Check Endpoint ---
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "cache_enabled": True,
        "cache_dir": settings.CACHE_DIR,
        "api_backend": "jolpica-f1"
    }


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server for local development...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)