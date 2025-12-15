from loguru import logger
import logging
from app.core.config import get_settings

settings = get_settings()


class InterceptHandler(logging.Handler):
    def emit(self, record):
        logger_opt = logger.opt(depth=6, exception=record.exc_info)
        logger_opt.log(record.levelno, record.getMessage())


def setup_logging():
    # Attach Loguru to standard logging
    logging.root.handlers = [InterceptHandler()]
    logging.root.setLevel(settings.log_level)

    # Configure Loguru outputs
    logger.remove()
    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="7 days",
        level=settings.log_level,
        backtrace=True,
        diagnose=True,
    )
