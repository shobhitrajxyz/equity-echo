import os
import time
import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
from typing import Dict, Any

app = FastAPI(title="Equity Echo Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE_OHLCV: Dict[str, Dict[str, Any]] = {}
CACHE_SEARCH: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 300

POPULAR_INDIAN_STOCKS = [
    {"symbol": "NSE:RELIANCE", "ticker": "RELIANCE.NS", "name": "Reliance Industries Ltd", "exchange": "NSE", "sector": "Energy", "aliases": ["RELIANCE", "RIL"]},
    {"symbol": "NSE:TCS", "ticker": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE", "sector": "IT", "aliases": ["TCS", "TATA"]},
    {"symbol": "NSE:INFY", "ticker": "INFY.NS", "name": "Infosys Ltd", "exchange": "NSE", "sector": "IT", "aliases": ["INFY", "INFOSYS"]},
    {"symbol": "NSE:HDFCBANK", "ticker": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "exchange": "NSE", "sector": "Banking", "aliases": ["HDFC", "HDFCBANK"]},
    {"symbol": "NSE:ICICIBANK", "ticker": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "exchange": "NSE", "sector": "Banking", "aliases": ["ICICI", "ICICIBANK"]},
    {"symbol": "NSE:SBIN", "ticker": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE", "sector": "Banking", "aliases": ["SBI", "STATE BANK"]},
    {"symbol": "NSE:BHARTIARTL", "ticker": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd", "exchange": "NSE", "sector": "Telecom", "aliases": ["AIRTEL", "BHARTI"]},
    {"symbol": "NSE:ITC", "ticker": "ITC.NS", "name": "ITC Ltd", "exchange": "NSE", "sector": "FMCG", "aliases": ["ITC"]},
    {"symbol": "NSE:TATAMOTORS", "ticker": "TATAMOTORS.NS", "name": "Tata Motors Ltd", "exchange": "NSE", "sector": "Auto", "aliases": ["TATA MOTORS", "TMCV"]},
    {"symbol": "NSE:TATASTEEL", "ticker": "TATASTEEL.NS", "name": "Tata Steel Ltd", "exchange": "NSE", "sector": "Metals", "aliases": ["TATA STEEL"]},
    {"symbol": "NSE:ZOMATO", "ticker": "ZOMATO.NS", "name": "Eternal Ltd (Zomato)", "exchange": "NSE", "sector": "Consumer Services", "aliases": ["ETERNAL", "ZOMATO"]},
    {"symbol": "NSE:SUZLON", "ticker": "SUZLON.NS", "name": "Suzlon Energy Ltd", "exchange": "NSE", "sector": "Renewable Energy", "aliases": ["SUZLON"]},
    {"symbol": "NSE:YESBANK", "ticker": "YESBANK.NS", "name": "Yes Bank Ltd", "exchange": "NSE", "sector": "Banking", "aliases": ["YES", "YESBANK"]},
    {"symbol": "NSE:PCI:AGROCHEMDOM", "ticker": "AGROCHEM.NS", "name": "Agro Chem Domestic Custom Index", "exchange": "NSE", "sector": "Chemicals", "aliases": ["AGRO", "PCI:AGROCHEMDOM"]},
    {"symbol": "NSE:ADANIENT", "ticker": "ADANIENT.NS", "name": "Adani Enterprises Ltd", "exchange": "NSE", "sector": "Conglomerate", "aliases": ["ADANI", "ADANIENT"]},
    {"symbol": "NSE:WIPRO", "ticker": "WIPRO.NS", "name": "Wipro Ltd", "exchange": "NSE", "sector": "IT", "aliases": ["WIPRO"]},
    {"symbol": "NSE:BAJFINANCE", "ticker": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd", "exchange": "NSE", "sector": "Financials", "aliases": ["BAJAJ", "BAJFINANCE"]},
    {"symbol": "NSE:LT", "ticker": "LT.NS", "name": "Larsen & Toubro Ltd", "exchange": "NSE", "sector": "Infrastructure", "aliases": ["L&T", "LT"]},
    {"symbol": "NSE:TITAN", "ticker": "TITAN.NS", "name": "Titan Company Ltd", "exchange": "NSE", "sector": "Consumer Goods", "aliases": ["TITAN"]},
    {"symbol": "NSE:HAL", "ticker": "HAL.NS", "name": "Hindustan Aeronautics Ltd", "exchange": "NSE", "sector": "Defence", "aliases": ["HAL"]},
    {"symbol": "NSE:BEL", "ticker": "BEL.NS", "name": "Bharat Electronics Ltd", "exchange": "NSE", "sector": "Defence", "aliases": ["BEL"]}
]

SYMBOL_ALIASES = {
    "ETERNAL": "ZOMATO.NS",
    "NSE:ETERNAL": "ZOMATO.NS",
    "ZOMATO": "ZOMATO.NS",
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "SBIN": "SBIN.NS",
}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Equity Echo Backend"}

@app.get("/api/search")
def search_stocks(q: str = Query("", min_length=1)):
    query = q.strip().upper()
    now = time.time()

    if query in CACHE_SEARCH and (now - CACHE_SEARCH[query]["timestamp"] < CACHE_TTL):
        return CACHE_SEARCH[query]["data"]

    results = []
    seen = set()

    for stock in POPULAR_INDIAN_STOCKS:
        aliases = stock.get("aliases", [])
        if (query in stock["symbol"].upper() or 
            query in stock["ticker"].upper() or 
            query in stock["name"].upper() or 
            query in stock["sector"].upper() or
            any(query in a.upper() for a in aliases)):
            results.append({
                "symbol": stock["symbol"],
                "ticker": stock["ticker"],
                "name": stock["name"],
                "exchange": stock["exchange"],
                "sector": stock["sector"]
            })
            seen.add(stock["ticker"])

    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=15&newsCount=0"
        headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
        resp = requests.get(url, headers=headers, timeout=1.5)
        if resp.status_code == 200:
            data = resp.json()
            quotes = data.get("quotes", [])
            for item in quotes:
                ticker = item.get("symbol", "")
                exch_disp = item.get("exchDisp", "").upper()
                is_indian = (
                    ticker.endswith(".NS") or 
                    ticker.endswith(".BO") or 
                    exch_disp in ["NSE", "BSE", "NATIONAL STOCK EXCHANGE OF INDIA"] or 
                    ticker.startswith("^NSE")
                )
                if is_indian and ticker not in seen:
                    exch = "NSE" if ticker.endswith(".NS") or "NSE" in exch_disp else "BSE"
                    clean_code = ticker.replace(".NS", "").replace(".BO", "")
                    disp_symbol = f"{exch}:{clean_code}"
                    name = item.get("longname") or item.get("shortname") or clean_code
                    results.append({
                        "symbol": disp_symbol,
                        "ticker": ticker,
                        "name": name,
                        "exchange": exch,
                        "sector": item.get("sector", item.get("typeDisp", "Equity"))
                    })
                    seen.add(ticker)
    except Exception as e:
        print(f"Yahoo Search error: {e}")

    resp_data = {"query": q, "suggestions": results[:10]}
    CACHE_SEARCH[query] = {"timestamp": now, "data": resp_data}
    return resp_data

@app.get("/api/charts/ohlcv/{symbol}")
def get_ohlcv(symbol: str, tf: str = "1D"):
    clean_sym = symbol.replace("NSE:", "").replace("BSE:", "").strip().upper()
    cache_key = f"{clean_sym}_{tf}"
    now = time.time()

    if cache_key in CACHE_OHLCV and (now - CACHE_OHLCV[cache_key]["timestamp"] < CACHE_TTL):
        return CACHE_OHLCV[cache_key]["data"]

    # Check symbol aliases
    if clean_sym in SYMBOL_ALIASES:
        ticker_str = SYMBOL_ALIASES[clean_sym]
    elif clean_sym == "PCI:AGROCHEMDOM" or clean_sym == "AGROCHEMDOM":
        ticker_str = "AGROCHEM.NS"
    elif clean_sym.startswith("^"):
        ticker_str = clean_sym
    elif not clean_sym.endswith((".NS", ".BO")):
        ticker_str = f"{clean_sym}.NS"
    else:
        ticker_str = clean_sym

    tf_map = {
        "1D": ("1y", "1d"),
        "1W": ("2y", "1wk"),
        "1M": ("5y", "1mo"),
        "15m": ("1mo", "15m"),
        "5m": ("7d", "5m")
    }
    period, interval = tf_map.get(tf, ("1y", "1d"))

    try:
        ticker = yf.Ticker(ticker_str)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            ticker_str_bse = f"{clean_sym}.BO"
            ticker = yf.Ticker(ticker_str_bse)
            df = ticker.history(period=period, interval=interval)

        if df.empty:
            return {"error": f"No data found for {symbol}", "prices": [], "events": []}

        prices = []
        for date_val, row in df.iterrows():
            if pd.isna(row["Open"]) or pd.isna(row["Close"]):
                continue
            date_str = date_val.strftime("%Y-%m-%d %H:%M") if "m" in interval else date_val.strftime("%Y-%m-%d")
            prices.append({
                "date": date_str,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0
            })

        events = []
        try:
            actions = ticker.actions
            if actions is not None and not actions.empty:
                for act_date, act_row in actions.iterrows():
                    d_str = act_date.strftime("%Y-%m-%d")
                    div = act_row.get("Dividends", 0)
                    split = act_row.get("Stock Splits", 0)
                    if div > 0:
                        events.append({"date": d_str, "type": "Dividend", "label": f"D: ₹{div:.2f}", "color": "#16a34a"})
                    if split > 0:
                        events.append({"date": d_str, "type": "Split", "label": f"S: 1:{int(split)}", "color": "#2563eb"})
        except Exception as e:
            print(f"Events error: {e}")

        last_price = prices[-1]["close"] if prices else 0.0
        prev_price = prices[-2]["close"] if len(prices) > 1 else last_price
        change = round(last_price - prev_price, 2)
        change_pct = round((change / prev_price * 100), 2) if prev_price else 0.0

        info_name = clean_sym
        try:
            info_name = ticker.info.get("shortName") or ticker.info.get("longName") or clean_sym
        except:
            pass

        result_data = {
            "symbol": symbol,
            "name": info_name,
            "currentPrice": last_price,
            "change": change,
            "changePercent": change_pct,
            "high": max((p["high"] for p in prices[-20:]), default=last_price),
            "low": min((p["low"] for p in prices[-20:]), default=last_price),
            "volume": prices[-1]["volume"] if prices else 0,
            "prices": prices,
            "events": events
        }

        CACHE_OHLCV[cache_key] = {"timestamp": now, "data": result_data}
        return result_data

    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return {"error": str(e), "prices": [], "events": []}
