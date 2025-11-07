const app = require('./app')
const config = require('./utils/config')
const logger = require('./utils/logger')
const worker = require('./workers/dispatcher')

app.listen(config.PORT, () => {
    logger.info(`Notification service running on port ${config.PORT}`)
    worker.start()
})