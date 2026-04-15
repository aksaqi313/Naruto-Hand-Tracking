Public RadarDistance
Public WaterLevel
Public PTemp
Public BattVolts
Public AlarmSelect
Public AlarmTrigger
Public ActiveAlarm
Public AlarmTimer
Public AlarmType As String * 12

Const AlarmDuration = 30
Const ReferenceHeight = 10.0

DataTable (AlarmLog, True, 1000)
  Sample (1, AlarmType, String)
  Sample (1, WaterLevel, FP2)
  Sample (1, PTemp, FP2)
  Sample (1, BattVolts, FP2)
EndTable

BeginProg
  Scan (1, Sec, 0, 0)

    ' --- Sensor Readings ---
    PanelTemp(PTemp, 50)
    Battery(BattVolts)
    WaterLevel = ReferenceHeight - RadarDistance

    ' --- AlarmSelect Guard ---
    ' AlarmSelect ONLY works when:
    ' ActiveAlarm = 0 AND AlarmTimer = 0 AND AlarmTrigger = 0
    ' Otherwise force AlarmSelect = locked (keep active alarm value)
    If ActiveAlarm = 0 AND AlarmTimer = 0 AND AlarmTrigger = 0 Then
      ' AlarmSelect free hai - user change kar sakta hai
    Else
      AlarmSelect = ActiveAlarm  ' Force locked to active alarm value
    EndIf

    ' --- AlarmTrigger Guard ---
    ' AlarmTrigger ONLY works when:
    ' AlarmSelect > 0 AND ActiveAlarm = 0 AND AlarmTimer = 0
    ' Otherwise force AlarmTrigger = 0
    If AlarmSelect > 0 AND ActiveAlarm = 0 AND AlarmTimer = 0 Then
      ' AlarmTrigger free hai - user click kar sakta hai
    Else
      AlarmTrigger = 0  ' Force OFF
    EndIf

    ' --- Alarm Fire ---
    If AlarmSelect > 0 AND AlarmTrigger = 1 AND ActiveAlarm = 0 AND AlarmTimer = 0 Then
      ActiveAlarm = AlarmSelect
      AlarmTimer  = AlarmDuration
      If ActiveAlarm = 1 Then
        AlarmType = "LOW"
      ElseIf ActiveAlarm = 2 Then
        AlarmType = "MEDIUM"
      ElseIf ActiveAlarm = 3 Then
        AlarmType = "HIGH"
      EndIf
      CallTable AlarmLog
      SW12(1)
    EndIf

    ' --- Countdown ---
    If ActiveAlarm > 0 AND AlarmTimer > 0 Then
      AlarmTimer = AlarmTimer - 1
      If AlarmTimer <= 0 Then
        AlarmTimer   = 0
        ActiveAlarm  = 0
        AlarmSelect  = 0
        AlarmTrigger = 0
        AlarmType    = "NORMAL"
        SW12(0)
      EndIf
    EndIf

  NextScan
EndProg