GitHub Link: https://github.com/adityarao97/LogLens
Colab Link: https://colab.research.google.com/drive/1A5-gbDmAL_LPUjtiXzhkHBYtg8pG0Gnj#scrollTo=WjjEnvVGUjfX
Note:Requirements for running the colab
1. Colab produces a ngrok API link which can be used in Postman to test the application, please change the URL as generated in the notebook.
2. Postman collection is specified alongside other files :LogLens.postman_collection.json
3. Credentials to be used are as follows:
HF_TOKEN        = "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"
SERPAPI_API_KEY = "4006359d4844a00d994f0f3e544870549e470bf9d043f804ab04466064244fb6"
DB_HOST         = "mydb-instance.c36ok0iyywfv.us-west-1.rds.amazonaws.com"
DB_USER         = "admin"
DB_PASSWORD     = "Aditya87Password"
DB_NAME         = "log_db"

If HuggingFace token gets expired please use these one for testing
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