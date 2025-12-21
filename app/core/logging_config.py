# from loguru import logger
# import logging
# from app.core.config import get_settings

# settings = get_settings()


# class InterceptHandler(logging.Handler):
#     def emit(self, record):
#         logger_opt = logger.opt(depth=6, exception=record.exc_info)
#         logger_opt.log(record.levelno, record.getMessage())


# def setup_logging():
#     # Attach Loguru to standard logging
#     logging.root.handlers = [InterceptHandler()]
#     logging.root.setLevel(settings.log_level)

#     # Configure Loguru outputs
#     logger.remove()
#     logger.add(
#         "logs/app.log",
#         rotation="10 MB",
#         retention="7 days",
#         level=settings.log_level,
#         backtrace=True,
#         diagnose=True,
#     )


from loguru import logger
import logging
import os
from opencensus.ext.azure.log_exporter import AzureLogHandler
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

    # Send standard-logging records to Application Insights (and thus Loguru messages too)
    connection_string = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
    if connection_string:
        azure_handler = AzureLogHandler(connection_string=connection_string)  # uses AI logs API [web:125]
        azure_handler.setLevel(settings.log_level)
        logging.root.addHandler(azure_handler)
