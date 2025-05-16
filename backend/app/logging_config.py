import logging
import logging.config
import os
from typing import Dict, Any, Optional, List

def setup_logging(
    log_level: str = "INFO", 
    log_file: Optional[str] = "app.log",
    console_log_level: Optional[str] = None,
    file_log_level: Optional[str] = None
) -> None:
    """
    Set up logging configuration for the entire application.
    
    Args:
        log_level: Default logging level for app modules (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Log file name (set to None to disable file logging)
        console_log_level: Optional separate log level for console output
        file_log_level: Optional separate log level for file output
    """
    # Create logs directory if it doesn't exist and log_file is specified
    log_file_path = None
    if log_file:
        logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
        os.makedirs(logs_dir, exist_ok=True)
        log_file_path = os.path.join(logs_dir, log_file)
    
    # Convert string levels to logging levels
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    console_numeric_level = getattr(logging, console_log_level.upper(), numeric_level) if console_log_level else numeric_level
    file_numeric_level = getattr(logging, file_log_level.upper(), numeric_level) if file_log_level else numeric_level
    
    # Define handlers based on configuration
    handlers = ["console"]
    if log_file:
        handlers.append("file")
    
    # Define FastAPI component loggers
    fastapi_loggers = [
        "fastapi", 
        "fastapi.error",
        "fastapi.access",
        "uvicorn",
        "uvicorn.access",
        "uvicorn.error",
        "starlette",
        "starlette.access",
        "starlette.server"
    ]
    
    # Define app component loggers
    app_loggers = [
        "app",
        "app.main",
        "app.dependencies",
        "app.database",
        "app.routers",
        "app.services",
        "app.api"
    ]
    
    # Define specific module loggers
    router_modules = [
        "app.routers.asset_categories", 
        "app.routers.asset_items",
        "app.routers.assignment_history",
        "app.routers.documents",
        "app.routers.employees",
        "app.routers.maintenance_history",
        "app.routers.request_approval"
    ]
    
    service_modules = [
        "app.services.asset_category_service",
        "app.services.asset_item_service",
        "app.services.assignment_history_service",
        "app.services.document_service",
        "app.services.employee_service",
        "app.services.maintenance_history_service",
        "app.services.analytics_service",
        "app.services.request_service"
    ]
    
    # Base configuration dictionary
    config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(client_addr)s - %(request_line)s - %(status_code)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "simple": {
                "format": "%(levelname)s - %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "level": console_numeric_level,
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "root": {
                "level": "WARNING",
                "handlers": handlers,
            },
        }
    }
    
    # Add file handler if log_file is specified
    if log_file:
        config["handlers"]["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "default",
            "level": file_numeric_level,
            "filename": log_file_path,
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
        }
    
    # Add FastAPI loggers
    for logger_name in fastapi_loggers:
        config["loggers"][logger_name] = {
            "level": "WARNING",  # Most FastAPI logs are noisy at INFO level
            "handlers": handlers,
            "propagate": False,
        }
    
    # Add app loggers
    for logger_name in app_loggers:
        config["loggers"][logger_name] = {
            "level": numeric_level,
            "handlers": handlers,
            "propagate": False,
        }
    
    # Add specific module loggers
    for logger_name in router_modules + service_modules:
        config["loggers"][logger_name] = {
            "level": numeric_level,
            "handlers": handlers,
            "propagate": False,
        }
    
    # Add MongoDB loggers
    for mongo_logger in ["pymongo", "pymongo.mongo_client", "motor"]:
        config["loggers"][mongo_logger] = {
            "level": "WARNING",
            "handlers": handlers,
            "propagate": False,
        }
    
    # Try to add colored formatter if colorlog is available
    try:
        import colorlog
        config["formatters"]["colored"] = {
            "()": "colorlog.ColoredFormatter",
            "format": "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
            "log_colors": {
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "red,bg_white",
            },
        }
        # Use colored formatter for console if available
        config["handlers"]["console"]["formatter"] = "colored"
    except ImportError:
        # colorlog not installed, continue with default formatter
        pass
    
    # Apply configuration
    logging.config.dictConfig(config)
    
    # Log startup message
    logger = logging.getLogger("app.main")
    logger.info(f"Logging configured successfully (level: {log_level})")

def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger for the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name) 