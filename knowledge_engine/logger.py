import logging
import json
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    def format(self, record):
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "funcName": record.funcName,
        }
        
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        # Include any extra attributes passed to the logger
        if hasattr(record, "extra_info"):
            log_record["extra"] = record.extra_info
            
        return json.dumps(log_record)

def setup_logger(name):
    """Set up and return a JSON-formatted logger."""
    logger = logging.getLogger(name)
    # Prevent duplicate handlers if setup_logger is called multiple times
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        # Don't propagate to the root logger to avoid duplicate logs in some environments
        logger.propagate = False
    return logger
