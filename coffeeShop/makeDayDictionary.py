import arcpy

fields = arcpy.ListFields("C:/Users/Devin Simmons/Desktop/ArcGIS/Coffee_Shop_Project/outputs/fullCafeDatasetFinal.shp")

keys = []

days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
values = []

for day in days:
    openTime = day + " Open"
    closeTime = day + " Close"
    values.append(openTime)
    values.append(closeTime)

for i in range(11, 25):
    key = fields[i].name
    key.encode("utf-8")
    keys.append(key)

for i in range(0, 14):
    if i != 13:
        print "'{}': '{}',".format(keys[i], values[i])
    else:
        print "'{}': '{}'".format(keys[i], values[i])
    

 


    
