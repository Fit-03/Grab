// ==========================================================================================================================================
// Copyright (c) 2025 Muhamad Fitri Bin Muhamad Edi (B122410708) & Muhamad Aznizul Humaidi Bin Zulkalnaini (B122410365). All rights reserved.
// This file is part of the Grab Assignment for BERR 2243 - Database And Cloud System.
// ==========================================================================================================================================

const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())

app.get('/', (req, res) => {
   res.send('Hello World!')
})

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})
